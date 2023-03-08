import "helpers.spec"
import "ERC20.spec"

methods {
    underlying()                       returns(address) envfree
    underlyingTotalSupply()            returns(uint256) envfree
    underlyingBalanceOf(address)       returns(uint256) envfree
    underlyingAllowanceToThis(address) returns(uint256) envfree

    depositFor(address, uint256)       returns(bool)
    withdrawTo(address, uint256)       returns(bool)
    recover(address)                   returns(uint256)
}

use invariant totalSupplyIsSumOfBalances

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helper: consequence of `totalSupplyIsSumOfBalances` applied to underlying                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
function sumOfUnderlyingBalancesLowerThanUnderlyingSupply(address a, address b) {
    if (a != b) {
        require underlyingBalanceOf(a) + underlyingBalanceOf(b) <= underlyingTotalSupply();
    } else {
        require underlyingBalanceOf(a) <= underlyingTotalSupply();
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: wrapped token can't be undercollateralized (solvency of the wrapper)                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant totalSupplyIsSmallerThanUnderlyingBalance()
    underlyingBalanceOf(currentContract) >= totalSupply() &&
    underlyingBalanceOf(currentContract) <= underlyingTotalSupply()
    {
        preserved {
            requireInvariant totalSupplyIsSumOfBalances;
            require underlyingBalanceOf(currentContract) <= underlyingTotalSupply();
        }
        preserved depositFor(address account, uint256 amount) with (env e) {
            require e.msg.sender != currentContract;
            sumOfUnderlyingBalancesLowerThanUnderlyingSupply(e.msg.sender, currentContract);
        }
    }

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
    require currentContract != sender;
    require currentContract != underlying();
    requireInvariant totalSupplyIsSumOfBalances;
    requireInvariant totalSupplyIsSmallerThanUnderlyingBalance;
    sumOfUnderlyingBalancesLowerThanUnderlyingSupply(currentContract, sender);

    uint256 balanceBefore                  = balanceOf(receiver);
    uint256 supplyBefore                   = totalSupply();
    uint256 underlyingSupplyBefore         = underlyingTotalSupply();
    uint256 wrapperUnderlyingBalanceBefore = underlyingBalanceOf(currentContract);
    uint256 senderUnderlyingBalanceBefore  = underlyingBalanceOf(sender);

    uint256 otherBalanceBefore             = balanceOf(other);
    uint256 otherUnderlyingBalanceBefore   = underlyingBalanceOf(other);

    depositFor@withrevert(e, receiver, amount);

    if (lastReverted) {
        assert (
            sender   == 0                              || // invalid sender
            receiver == 0                              || // invalid receiver
            amount > senderUnderlyingBalanceBefore     || // deposit more than balance
            amount > underlyingAllowanceToThis(sender) || // deposit more than allowance
            balanceBefore + amount > max_uint256          // sanity: cannot overflow (bounded by underlying totalSupply)
        );
    } else {
        assert balanceOf(receiver)                  == balanceBefore + amount;
        assert totalSupply()                        == supplyBefore + amount;
        assert underlyingTotalSupply()              == underlyingSupplyBefore;
        assert underlyingBalanceOf(currentContract) == wrapperUnderlyingBalanceBefore + amount;
        assert underlyingBalanceOf(sender)          == senderUnderlyingBalanceBefore  - amount;

        assert balanceOf(other)           != otherBalanceBefore           => other == receiver;
        assert underlyingBalanceOf(other) != otherUnderlyingBalanceBefore => (other == sender || other == currentContract);
    }
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
    require currentContract != underlying();
    requireInvariant totalSupplyIsSumOfBalances;
    requireInvariant totalSupplyIsSmallerThanUnderlyingBalance;
    sumOfUnderlyingBalancesLowerThanUnderlyingSupply(currentContract, receiver);

    uint256 balanceBefore                   = balanceOf(sender);
    uint256 supplyBefore                    = totalSupply();
    uint256 underlyingSupplyBefore          = underlyingTotalSupply();
    uint256 wrapperUnderlyingBalanceBefore  = underlyingBalanceOf(currentContract);
    uint256 receiverUnderlyingBalanceBefore = underlyingBalanceOf(receiver);

    uint256 otherBalanceBefore              = balanceOf(other);
    uint256 otherUnderlyingBalanceBefore    = underlyingBalanceOf(other);

    withdrawTo@withrevert(e, receiver, amount);

    if (lastReverted) {
        assert (
            sender   == 0                                       || // invalid sender
            receiver == 0                                       || // invalid receiver
            amount > balanceBefore                              || // withdraw more than balance
            receiverUnderlyingBalanceBefore + amount > max_uint256 // sanity: cannot overflow (bounded by underlying totalSupply)
        );
    } else {
        assert balanceOf(sender)                    == balanceBefore - amount;
        assert totalSupply()                        == supplyBefore  - amount;
        assert underlyingTotalSupply()              == underlyingSupplyBefore;
        assert underlyingBalanceOf(currentContract) == wrapperUnderlyingBalanceBefore  - (currentContract != receiver ? amount : 0);
        assert underlyingBalanceOf(receiver)        == receiverUnderlyingBalanceBefore + (currentContract != receiver ? amount : 0);

        assert balanceOf(other)           != otherBalanceBefore           => other == sender;
        assert underlyingBalanceOf(other) != otherUnderlyingBalanceBefore => (other == receiver || other == currentContract);
    }
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
    require currentContract != underlying();
    requireInvariant totalSupplyIsSumOfBalances;
    requireInvariant totalSupplyIsSmallerThanUnderlyingBalance;

    uint256 value                        = underlyingBalanceOf(currentContract) - totalSupply();
    uint256 supplyBefore                 = totalSupply();
    uint256 balanceBefore                = balanceOf(receiver);

    uint256 otherBalanceBefore           = balanceOf(other);
    uint256 otherUnderlyingBalanceBefore = underlyingBalanceOf(other);

    recover@withrevert(e, receiver);

    if (lastReverted) {
        assert receiver == 0;
    } else {
        assert balanceOf(receiver) == balanceBefore + value;
        assert totalSupply()       == supplyBefore + value;
        assert totalSupply()       == underlyingBalanceOf(currentContract);

        assert balanceOf(other) != otherBalanceBefore => other == receiver;
        assert underlyingBalanceOf(other) == otherUnderlyingBalanceBefore;
    }
}
