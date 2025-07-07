import "helpers/helpers.spec";
import "ERC20.spec";

methods {
    function underlying()                          external returns(address) envfree;
    function underlyingTotalSupply()               external returns(uint256) envfree;
    function underlyingBalanceOf(address)          external returns(uint256) envfree;
    function underlyingAllowance(address, address) external returns(uint256) envfree;

    function depositFor(address, uint256)          external returns(bool);
    function withdrawTo(address, uint256)          external returns(bool);
    function recover(address)                      external returns(uint256);
}

use invariant totalSupplyIsSumOfBalances;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helper: consequence of `totalSupplyIsSumOfBalances` applied to underlying                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition sumOfUnderlyingBalancesLowerThanUnderlyingSupply(address a, address b) returns bool =
    a != b => underlyingBalanceOf(a) + underlyingBalanceOf(b) <= to_mathint(underlyingTotalSupply());

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: wrapped token should not allow any third party to spend its tokens                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant noAllowance(address user)
    underlyingAllowance(currentContract, user) == 0
    {
        preserved ERC20PermitHarness.approve(address spender, uint256 value) with (env e) {
            require e.msg.sender != currentContract;
        }
        preserved ERC20PermitHarness.permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) with (env e) {
            require owner != currentContract;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: wrapped token can't be undercollateralized (solvency of the wrapper)                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant totalSupplyIsSmallerThanUnderlyingBalance()
    totalSupply() <= underlyingBalanceOf(currentContract) &&
    underlyingBalanceOf(currentContract) <= underlyingTotalSupply() &&
    underlyingTotalSupply() <= max_uint256
    {
        preserved with (env e) {
            requireInvariant totalSupplyIsSumOfBalances;
            require e.msg.sender != currentContract;
            require sumOfUnderlyingBalancesLowerThanUnderlyingSupply(e.msg.sender, currentContract);
        }
        preserved ERC20PermitHarness.transferFrom(address from, address to, uint256 amount) with (env e) {
            requireInvariant noAllowance(e.msg.sender);
            require sumOfUnderlyingBalancesLowerThanUnderlyingSupply(from, to);
        }
        preserved ERC20PermitHarness.burn(address from, uint256 amount) with (env e) {
            // If someone can burn from the wrapper, than the invariant obviously doesn't hold.
            require from != currentContract;
            require sumOfUnderlyingBalancesLowerThanUnderlyingSupply(from, currentContract);
        }
    }

invariant noSelfWrap()
    currentContract != underlying();

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: depositFor liveness and effects                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule depositFor(env e) {
    require nonpayable(e);

    address sender = e.msg.sender;
    address receiver;
    address other;
    uint256 amount;

    // sanity
    requireInvariant noSelfWrap;
    requireInvariant totalSupplyIsSumOfBalances;
    requireInvariant totalSupplyIsSmallerThanUnderlyingBalance;
    require sumOfUnderlyingBalancesLowerThanUnderlyingSupply(currentContract, sender);

    uint256 balanceBefore                   = balanceOf(receiver);
    uint256 supplyBefore                    = totalSupply();
    uint256 senderUnderlyingBalanceBefore   = underlyingBalanceOf(sender);
    uint256 senderUnderlyingAllowanceBefore = underlyingAllowance(sender, currentContract);
    uint256 wrapperUnderlyingBalanceBefore  = underlyingBalanceOf(currentContract);
    uint256 underlyingSupplyBefore          = underlyingTotalSupply();

    uint256 otherBalanceBefore              = balanceOf(other);
    uint256 otherUnderlyingBalanceBefore    = underlyingBalanceOf(other);

    depositFor@withrevert(e, receiver, amount);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        sender   != currentContract               && // invalid sender
        sender   != 0                             && // invalid sender
        receiver != currentContract               && // invalid receiver
        receiver != 0                             && // invalid receiver
        amount   <= senderUnderlyingBalanceBefore && // deposit doesn't exceed balance
        amount   <= senderUnderlyingAllowanceBefore  // deposit doesn't exceed allowance
    );

    // effects
    assert success => (
        to_mathint(balanceOf(receiver)) == balanceBefore + amount &&
        to_mathint(totalSupply()) == supplyBefore + amount &&
        to_mathint(underlyingBalanceOf(currentContract)) == wrapperUnderlyingBalanceBefore + amount &&
        to_mathint(underlyingBalanceOf(sender)) == senderUnderlyingBalanceBefore - amount
    );

    // no side effect
    assert underlyingTotalSupply() == underlyingSupplyBefore;
    assert balanceOf(other)           != otherBalanceBefore           => other == receiver;
    assert underlyingBalanceOf(other) != otherUnderlyingBalanceBefore => (other == sender || other == currentContract);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: withdrawTo liveness and effects                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule withdrawTo(env e) {
    require nonpayable(e);

    address sender = e.msg.sender;
    address receiver;
    address other;
    uint256 amount;

    // sanity
    requireInvariant noSelfWrap;
    requireInvariant totalSupplyIsSumOfBalances;
    requireInvariant totalSupplyIsSmallerThanUnderlyingBalance;
    require sumOfUnderlyingBalancesLowerThanUnderlyingSupply(currentContract, receiver);

    uint256 balanceBefore                   = balanceOf(sender);
    uint256 supplyBefore                    = totalSupply();
    uint256 receiverUnderlyingBalanceBefore = underlyingBalanceOf(receiver);
    uint256 wrapperUnderlyingBalanceBefore  = underlyingBalanceOf(currentContract);
    uint256 underlyingSupplyBefore          = underlyingTotalSupply();

    uint256 otherBalanceBefore              = balanceOf(other);
    uint256 otherUnderlyingBalanceBefore    = underlyingBalanceOf(other);

    withdrawTo@withrevert(e, receiver, amount);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        sender   != 0               && // invalid sender
        receiver != currentContract && // invalid receiver
        receiver != 0               && // invalid receiver
        amount   <= balanceBefore      // withdraw doesn't exceed balance
    );

    // effects
    assert success => (
        to_mathint(balanceOf(sender)) == balanceBefore - amount &&
        to_mathint(totalSupply()) == supplyBefore - amount &&
        to_mathint(underlyingBalanceOf(currentContract)) == wrapperUnderlyingBalanceBefore - (currentContract != receiver ? amount : 0) &&
        to_mathint(underlyingBalanceOf(receiver)) == receiverUnderlyingBalanceBefore + (currentContract != receiver ? amount : 0)
    );

    // no side effect
    assert underlyingTotalSupply() == underlyingSupplyBefore;
    assert balanceOf(other)           != otherBalanceBefore           => other == sender;
    assert underlyingBalanceOf(other) != otherUnderlyingBalanceBefore => (other == receiver || other == currentContract);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: recover liveness and effects                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule recover(env e) {
    require nonpayable(e);

    address receiver;
    address other;

    // sanity
    requireInvariant noSelfWrap;
    requireInvariant totalSupplyIsSumOfBalances;
    requireInvariant totalSupplyIsSmallerThanUnderlyingBalance;

    mathint value                        = underlyingBalanceOf(currentContract) - totalSupply();
    uint256 supplyBefore                 = totalSupply();
    uint256 balanceBefore                = balanceOf(receiver);

    uint256 otherBalanceBefore           = balanceOf(other);
    uint256 otherUnderlyingBalanceBefore = underlyingBalanceOf(other);

    recover@withrevert(e, receiver);
    bool success = !lastReverted;

    // liveness
    assert success <=> receiver != 0;

    // effect
    assert success => (
        to_mathint(balanceOf(receiver)) == balanceBefore + value &&
        to_mathint(totalSupply()) == supplyBefore + value &&
        totalSupply() == underlyingBalanceOf(currentContract)
    );

    // no side effect
    assert underlyingBalanceOf(other) == otherUnderlyingBalanceBefore;
    assert balanceOf(other) != otherBalanceBefore => other == receiver;
}
