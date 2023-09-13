import "helpers/helpers.spec";
import "methods/IERC20.spec";
import "methods/IERC2612.spec";

methods {
    // exposed for FV
    function mint(address,uint256) external;
    function burn(address,uint256) external;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks: sum of all balances                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost mathint sumOfBalances {
    init_state axiom sumOfBalances == 0;
}

// Because `balance` has a uint256 type, any balance addition in CVL1 behaved as a `require_uint256()` casting,
// leaving out the possibility of overflow. This is not the case in CVL2 where casting became more explicit.
// A counterexample in CVL2 is having an initial state where Alice initial balance is larger than totalSupply, which 
// overflows Alice's balance when receiving a transfer. This is not possible unless the contract is deployed into an 
// already used address (or upgraded from corrupted state).
// We restrict such behavior by making sure no balance is greater than the sum of balances.
hook Sload uint256 balance _balances[KEY address addr] STORAGE {
    require sumOfBalances >= to_mathint(balance);
}

hook Sstore _balances[KEY address addr] uint256 newValue (uint256 oldValue) STORAGE {
    sumOfBalances = sumOfBalances - oldValue + newValue;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: totalSupply is the sum of all balances                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant totalSupplyIsSumOfBalances()
    to_mathint(totalSupply()) == sumOfBalances;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: balance of address(0) is 0                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant zeroAddressNoBalance()
    balanceOf(0) == 0;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: only mint and burn can change total supply                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noChangeTotalSupply(env e) {
    requireInvariant totalSupplyIsSumOfBalances();

    method f;
    calldataarg args;

    uint256 totalSupplyBefore = totalSupply();
    f(e, args);
    uint256 totalSupplyAfter = totalSupply();

    assert totalSupplyAfter > totalSupplyBefore => f.selector == sig:mint(address,uint256).selector;
    assert totalSupplyAfter < totalSupplyBefore => f.selector == sig:burn(address,uint256).selector;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: only the token holder or an approved third party can reduce an account's balance                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyAuthorizedCanTransfer(env e) {
    requireInvariant totalSupplyIsSumOfBalances();

    method f;
    calldataarg args;
    address account;

    uint256 allowanceBefore = allowance(account, e.msg.sender);
    uint256 balanceBefore   = balanceOf(account);
    f(e, args);
    uint256 balanceAfter    = balanceOf(account);

    assert (
        balanceAfter < balanceBefore
    ) => (
        f.selector == sig:burn(address,uint256).selector ||
        e.msg.sender == account ||
        balanceBefore - balanceAfter <= to_mathint(allowanceBefore)
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: only the token holder (or a permit) can increase allowance. The spender can decrease it by using it          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyHolderOfSpenderCanChangeAllowance(env e) {
    requireInvariant totalSupplyIsSumOfBalances();

    method f;
    calldataarg args;
    address holder;
    address spender;

    uint256 allowanceBefore = allowance(holder, spender);
    f(e, args);
    uint256 allowanceAfter = allowance(holder, spender);

    assert (
        allowanceAfter > allowanceBefore
    ) => (
        (f.selector == sig:approve(address,uint256).selector           && e.msg.sender == holder) ||
        (f.selector == sig:permit(address,address,uint256,uint256,uint8,bytes32,bytes32).selector)
    );

    assert (
        allowanceAfter < allowanceBefore
    ) => (
        (f.selector == sig:transferFrom(address,address,uint256).selector && e.msg.sender == spender) ||
        (f.selector == sig:approve(address,uint256).selector              && e.msg.sender == holder ) ||
        (f.selector == sig:permit(address,address,uint256,uint256,uint8,bytes32,bytes32).selector)
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: mint behavior and side effects                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule mint(env e) {
    requireInvariant totalSupplyIsSumOfBalances();
    require nonpayable(e);

    address to;
    address other;
    uint256 amount;

    // cache state
    uint256 toBalanceBefore    = balanceOf(to);
    uint256 otherBalanceBefore = balanceOf(other);
    uint256 totalSupplyBefore  = totalSupply();

    // run transaction
    mint@withrevert(e, to, amount);

    // check outcome
    if (lastReverted) {
        assert to == 0 || totalSupplyBefore + amount > max_uint256;
    } else {
        // updates balance and totalSupply
        assert to_mathint(balanceOf(to)) == toBalanceBefore   + amount;
        assert to_mathint(totalSupply()) == totalSupplyBefore + amount;

        // no other balance is modified
        assert balanceOf(other) != otherBalanceBefore => other == to;
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: burn behavior and side effects                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule burn(env e) {
    requireInvariant totalSupplyIsSumOfBalances();
    require nonpayable(e);

    address from;
    address other;
    uint256 amount;

    // cache state
    uint256 fromBalanceBefore  = balanceOf(from);
    uint256 otherBalanceBefore = balanceOf(other);
    uint256 totalSupplyBefore  = totalSupply();

    // run transaction
    burn@withrevert(e, from, amount);

    // check outcome
    if (lastReverted) {
        assert from == 0 || fromBalanceBefore < amount;
    } else {
        // updates balance and totalSupply
        assert to_mathint(balanceOf(from)) == fromBalanceBefore   - amount;
        assert to_mathint(totalSupply())   == totalSupplyBefore - amount;

        // no other balance is modified
        assert balanceOf(other) != otherBalanceBefore => other == from;
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: transfer behavior and side effects                                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transfer(env e) {
    requireInvariant totalSupplyIsSumOfBalances();
    require nonpayable(e);

    address holder = e.msg.sender;
    address recipient;
    address other;
    uint256 amount;

    // cache state
    uint256 holderBalanceBefore    = balanceOf(holder);
    uint256 recipientBalanceBefore = balanceOf(recipient);
    uint256 otherBalanceBefore     = balanceOf(other);

    // run transaction
    transfer@withrevert(e, recipient, amount);

    // check outcome
    if (lastReverted) {
        assert holder == 0 || recipient == 0 || amount > holderBalanceBefore;
    } else {
        // balances of holder and recipient are updated
        assert to_mathint(balanceOf(holder))    == holderBalanceBefore    - (holder == recipient ? 0 : amount);
        assert to_mathint(balanceOf(recipient)) == recipientBalanceBefore + (holder == recipient ? 0 : amount);

        // no other balance is modified
        assert balanceOf(other) != otherBalanceBefore => (other == holder || other == recipient);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: transferFrom behavior and side effects                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transferFrom(env e) {
    requireInvariant totalSupplyIsSumOfBalances();
    require nonpayable(e);

    address spender = e.msg.sender;
    address holder;
    address recipient;
    address other;
    uint256 amount;

    // cache state
    uint256 allowanceBefore        = allowance(holder, spender);
    uint256 holderBalanceBefore    = balanceOf(holder);
    uint256 recipientBalanceBefore = balanceOf(recipient);
    uint256 otherBalanceBefore     = balanceOf(other);

    // run transaction
    transferFrom@withrevert(e, holder, recipient, amount);

    // check outcome
    if (lastReverted) {
        assert holder == 0 || recipient == 0 || spender == 0 || amount > holderBalanceBefore || amount > allowanceBefore;
    } else {
        // allowance is valid & updated
        assert allowanceBefore            >= amount;
        assert to_mathint(allowance(holder, spender)) == (allowanceBefore == max_uint256 ? max_uint256 : allowanceBefore - amount);

        // balances of holder and recipient are updated
        assert to_mathint(balanceOf(holder))    == holderBalanceBefore    - (holder == recipient ? 0 : amount);
        assert to_mathint(balanceOf(recipient)) == recipientBalanceBefore + (holder == recipient ? 0 : amount);

        // no other balance is modified
        assert balanceOf(other) != otherBalanceBefore => (other == holder || other == recipient);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: approve behavior and side effects                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule approve(env e) {
    require nonpayable(e);

    address holder = e.msg.sender;
    address spender;
    address otherHolder;
    address otherSpender;
    uint256 amount;

    // cache state
    uint256 otherAllowanceBefore = allowance(otherHolder, otherSpender);

    // run transaction
    approve@withrevert(e, spender, amount);

    // check outcome
    if (lastReverted) {
        assert holder == 0 || spender == 0;
    } else {
        // allowance is updated
        assert allowance(holder, spender) == amount;

        // other allowances are untouched
        assert allowance(otherHolder, otherSpender) != otherAllowanceBefore => (otherHolder == holder && otherSpender == spender);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: permit behavior and side effects                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule permit(env e) {
    require nonpayable(e);

    address holder;
    address spender;
    uint256 amount;
    uint256 deadline;
    uint8 v;
    bytes32 r;
    bytes32 s;

    address account1;
    address account2;
    address account3;

    // cache state
    uint256 nonceBefore          = nonces(holder);
    uint256 otherNonceBefore     = nonces(account1);
    uint256 otherAllowanceBefore = allowance(account2, account3);

    // sanity: nonce overflow, which possible in theory, is assumed to be impossible in practice
    require nonceBefore      < max_uint256;
    require otherNonceBefore < max_uint256;

    // run transaction
    permit@withrevert(e, holder, spender, amount, deadline, v, r, s);

    // check outcome
    if (lastReverted) {
        // Without formally checking the signature, we can't verify exactly the revert causes
        assert true;
    } else {
        // allowance and nonce are updated
        assert allowance(holder, spender) == amount;
        assert to_mathint(nonces(holder)) == nonceBefore + 1;

        // deadline was respected
        assert deadline >= e.block.timestamp;

        // no other allowance or nonce is modified
        assert nonces(account1)              != otherNonceBefore     => account1 == holder;
        assert allowance(account2, account3) != otherAllowanceBefore => (account2 == holder && account3 == spender);
    }
}
