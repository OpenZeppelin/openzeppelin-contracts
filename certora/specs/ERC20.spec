import "interfaces/erc20.spec"

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks: sum of all balances                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost sumOfBalances() returns uint256 {
  init_state axiom sumOfBalances() == 0;
}

hook Sstore _balances[KEY address addr] uint256 newValue (uint256 oldValue) STORAGE {
    havoc sumOfBalances assuming sumOfBalances@new() == sumOfBalances@old() + newValue - oldValue;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: totalSupply is the sum of all balances                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant totalSupplyIsSumOfBalances()
    totalSupply() == sumOfBalances()

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: balance of address(0) is 0                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant zeroAddressNoBalance()
    balanceOf(0) == 0

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: only mint and burn can change total supply                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule noChangeTotalSupply() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    method f;
    calldataarg args;

    uint256 totalSupplyBefore = totalSupply();
    f(e, args);
    uint256 totalSupplyAfter = totalSupply();

    assert (totalSupplyAfter > totalSupplyBefore) => (f.selector == _mint(address,uint256).selector);
    assert (totalSupplyAfter < totalSupplyBefore) => (f.selector == _burn(address,uint256).selector);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: only the token holder or an approved third party can reduce an account's balance                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyAuthorizedCanTransfer() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
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
        f.selector == _burn(address,uint256).selector ||
        e.msg.sender == account ||
        balanceBefore - balanceAfter <= allowanceBefore
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: only the token holder (or a permit) can increase allowance. The spender can decrease it by using it          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule onlyHolderOfSpenderCanChangeAllowance() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
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
        (f.selector == approve(address,uint256).selector           && e.msg.sender == holder) ||
        (f.selector == increaseAllowance(address,uint256).selector && e.msg.sender == holder) ||
        (f.selector == permit(address,address,uint256,uint256,uint8,bytes32,bytes32).selector)
    );

    assert (
        allowanceAfter < allowanceBefore
    ) => (
        (f.selector == approve(address,uint256).selector              && e.msg.sender == holder ) ||
        (f.selector == decreaseAllowance(address,uint256).selector    && e.msg.sender == holder ) ||
        (f.selector == transferFrom(address,address,uint256).selector && e.msg.sender == spender) ||
        (f.selector == permit(address,address,uint256,uint256,uint8,bytes32,bytes32).selector)
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: mint behavior and side effects                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule mint() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address to;
    address other;
    uint256 amount;

    // env: function is not payable
    require e.msg.sender != 0;
    require e.msg.value  == 0;

    // cache state
    uint256 toBalanceBefore    = balanceOf(to);
    uint256 otherBalanceBefore = balanceOf(other);
    uint256 totalSupplyBefore  = totalSupply();

    // run transaction
    _mint@withrevert(e, to, amount);

    // check outcome
    if (lastReverted) {
        assert to == 0 || totalSupplyBefore + amount > to_uint256(max_uint256);
    } else {
        // updates balance and totalSupply
        assert balanceOf(to) == toBalanceBefore   + amount;
        assert totalSupply() == totalSupplyBefore + amount;

        // no other balance is modified
        assert balanceOf(other) != otherBalanceBefore => other == to;
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: burn behavior and side effects                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule burn() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address from;
    address other;
    uint256 amount;

    // env: function is not payable
    require e.msg.sender != 0;
    require e.msg.value  == 0;

    // cache state
    uint256 fromBalanceBefore  = balanceOf(from);
    uint256 otherBalanceBefore = balanceOf(other);
    uint256 totalSupplyBefore  = totalSupply();

    // run transaction
    _burn@withrevert(e, from, amount);

    // check outcome
    if (lastReverted) {
        assert from == 0 || fromBalanceBefore < amount;
    } else {
        // updates balance and totalSupply
        assert balanceOf(from) == fromBalanceBefore   - amount;
        assert totalSupply()   == totalSupplyBefore - amount;

        // no other balance is modified
        assert balanceOf(other) != otherBalanceBefore => other == from;
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: transfer behavior and side effects                                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transfer() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address holder = e.msg.sender;
    address recipient;
    address other;
    uint256 amount;

    // env: function is not payable
    require e.msg.sender != 0;
    require e.msg.value  == 0;

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
        assert balanceOf(holder)    == holderBalanceBefore    - (holder == recipient ? 0 : amount);
        assert balanceOf(recipient) == recipientBalanceBefore + (holder == recipient ? 0 : amount);

        // no other balance is modified
        assert balanceOf(other) != otherBalanceBefore => (other == holder || other == recipient);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: transferFrom behavior and side effects                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transferFrom() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address holder;
    address recipient;
    address other;
    uint256 amount;

    // env: function is not payable
    require e.msg.sender != 0;
    require e.msg.value  == 0;

    // cache state
    uint256 allowanceBefore        = allowance(holder, e.msg.sender);
    uint256 holderBalanceBefore    = balanceOf(holder);
    uint256 recipientBalanceBefore = balanceOf(recipient);
    uint256 otherBalanceBefore     = balanceOf(other);

    // run transaction
    transferFrom@withrevert(e, holder, recipient, amount);

    // check outcome
    if (lastReverted) {
        assert holder == 0 || recipient == 0 || amount > holderBalanceBefore || amount > allowanceBefore;
    } else {
        // allowance is valid & updated
        assert allowanceBefore                 >= amount;
        assert allowance(holder, e.msg.sender) == (allowanceBefore == max_uint256 ? to_uint256(max_uint256) : allowanceBefore - amount);

        // balances of holder and recipient are updated
        assert balanceOf(holder)               == holderBalanceBefore    - (holder == recipient ? 0 : amount);
        assert balanceOf(recipient)            == recipientBalanceBefore + (holder == recipient ? 0 : amount);

        // no other balance is modified
        assert balanceOf(other) != otherBalanceBefore => (other == holder || other == recipient);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: approve behavior and side effects                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule approve() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address holder = e.msg.sender;
    address spender;
    address otherHolder;
    address otherSpender;
    uint256 amount;

    // env: function is not payable
    require e.msg.sender != 0;
    require e.msg.value  == 0;

    // cache state
    uint256 otherAllowanceBefore = allowance(otherHolder, otherSpender);

    // run transaction
    approve@withrevert(e, spender, amount);

    // check outcome
    if (lastReverted) {
        assert spender == 0;
    } else {
        // allowance is updated
        assert allowance(holder, spender) == amount;

        // other allowances are untouched
        assert allowance(otherHolder, otherSpender) != otherAllowanceBefore => (otherHolder == holder && otherSpender == spender);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: increaseAllowance behavior and side effects                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule increaseAllowance() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address holder = e.msg.sender;
    address spender;
    address otherHolder;
    address otherSpender;
    uint256 amount;

    // env: function is not payable
    require e.msg.sender != 0;
    require e.msg.value  == 0;

    // cache state
    uint256 allowanceBefore      = allowance(holder, spender);
    uint256 otherAllowanceBefore = allowance(otherHolder, otherSpender);

    // run transaction
    increaseAllowance@withrevert(e, spender, amount);

    // check outcome
    if (lastReverted) {
        assert spender == 0 || allowanceBefore + amount > max_uint256;
    } else {
        // allowance is updated
        assert allowance(holder, spender) == allowanceBefore + amount;

        // other allowances are untouched
        assert allowance(otherHolder, otherSpender) != otherAllowanceBefore => (otherHolder == holder && otherSpender == spender);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: decreaseAllowance behavior and side effects                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule decreaseAllowance() {
    requireInvariant totalSupplyIsSumOfBalances();

    env e;
    address holder = e.msg.sender;
    address spender;
    address otherHolder;
    address otherSpender;
    uint256 amount;

    // env: function is not payable
    require e.msg.sender != 0;
    require e.msg.value  == 0;

    // cache state
    uint256 allowanceBefore      = allowance(holder, spender);
    uint256 otherAllowanceBefore = allowance(otherHolder, otherSpender);

    // run transaction
    decreaseAllowance@withrevert(e, spender, amount);

    // check outcome
    if (lastReverted) {
        assert spender == 0 || allowanceBefore < amount;
    } else {
        // allowance is updated
        assert allowance(holder, spender) == allowanceBefore - amount;

        // other allowances are untouched
        assert allowance(otherHolder, otherSpender) != otherAllowanceBefore => (otherHolder == holder && otherSpender == spender);
    }
}
