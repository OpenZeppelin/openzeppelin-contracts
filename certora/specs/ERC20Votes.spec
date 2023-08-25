import "helpers/helpers.spec";
import "methods/IERC20.spec";
import "methods/IERC5805.spec";
import "methods/IERC6372.spec";

methods {
    function numCheckpoints(address)      external returns (uint32)  envfree;
    function ckptClock(address, uint32)   external returns (uint32)  envfree;
    function ckptVotes(address, uint32)   external returns (uint224) envfree;
    function numCheckpointsTotalSupply()  external returns (uint32)  envfree;
    function ckptClockTotalSupply(uint32) external returns (uint32)  envfree;
    function ckptVotesTotalSupply(uint32) external returns (uint224) envfree;
    function maxSupply()                  external returns (uint224) envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: clock                                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
function clockSanity(env e) returns bool {
    return clock(e) <= max_uint32;
}

invariant clockMode(env e)
    assert_uint256(clock(e)) == e.block.number || assert_uint256(clock(e)) == e.block.timestamp;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks: total delegated                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// copied from ERC20.spec (can't be imported because of hook conflicts)
ghost mathint sumOfBalances {
    init_state axiom sumOfBalances == 0;
}

ghost mapping(address => mathint) balance {
    init_state axiom forall address a. balance[a] == 0;
}

ghost mapping(address => address) delegate {
    init_state axiom forall address a. delegate[a] == 0;
}

ghost mapping(address => mathint) votes {
    init_state axiom forall address a. votes[a] == 0;
}

hook Sload uint256 balance _balances[KEY address addr] STORAGE {
    require sumOfBalances >= to_mathint(balance);
}

hook Sstore _balances[KEY address addr] uint256 newValue (uint256 oldValue) STORAGE {
    balance[addr] = newValue;
    sumOfBalances = sumOfBalances - oldValue + newValue;
    votes[delegate[addr]] = votes[delegate[addr]] + newValue - oldValue;
}

hook Sstore _delegatee[KEY address addr] address newDelegate (address oldDelegate) STORAGE {
    delegate[addr] = newDelegate;
    votes[oldDelegate] = votes[oldDelegate] - balance[addr];
    votes[newDelegate] = votes[newDelegate] + balance[addr];
}

// all votes (total supply) minus the votes balances delegated to 0
definition totalVotes() returns mathint = sumOfBalances - votes[0];

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: copied from ERC20.spec (can't be imported because of hook conflicts)                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant totalSupplyIsSumOfBalances()
    to_mathint(totalSupply()) == sumOfBalances;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: zero address has no delegate, no votes and no checkpoints                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant zeroAddressConsistency()
    balanceOf(0) == 0 &&
    delegates(0) == 0 &&
    getVotes(0) == 0 &&
    numCheckpoints(0) == 0
    {
        preserved with (env e) {
            // we assume address 0 cannot perform any call
            require e.msg.sender != 0;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: hook correctly track latest checkpoint                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// TODO: forall address a.
invariant balanceDelegateAndVoteConsistency(address a)
    delegates(a) == delegate[a] &&
    to_mathint(balanceOf(a)) == balance[a] &&
    a != 0 => to_mathint(getVotes(a)) == votes[a];

// TODO: forall address a.
invariant voteBiggerThanDelegatedBalances(address a)
    getVotes(delegates(a)) >= balanceOf(a)
    {
        preserved {
            requireInvariant zeroAddressConsistency();
        }
    }

// TODO: forall address a.
invariant userVotesLessTotalVotes(address a)
    votes[a] <= totalVotes()
    {
        preserved {
            requireInvariant totalSupplyIsSumOfBalances;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Checkpoints: number, ordering and consistency with clock                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// TODO: forall address a.
invariant checkpointInThePast(env e, address a)
    forall uint32 i.
    numCheckpoints(a) > i => to_mathint(ckptClock(a, i)) <= to_mathint(clock(e))
    {
        preserved with (env e2) {
            require clock(e2) <= clock(e);
        }
    }

invariant totalCheckpointInThePast(env e)
    forall uint32 i.
    numCheckpointsTotalSupply() > i => to_mathint(ckptClockTotalSupply(i)) <= to_mathint(clock(e))
    {
        preserved with (env e2) {
            require clock(e2) <= clock(e);
        }
    }

// TODO: forall address a.
invariant checkpointClockIncreassing(address a)
    forall uint32 i.
    forall uint32 j.
    (i < j && j < numCheckpoints(a)) => ckptClock(a, i) < ckptClock(a, j)
    {
        preserved with (env e) {
            requireInvariant checkpointInThePast(e, a);
        }
    }

invariant totalCheckpointClockIncreassing()
    forall uint32 i.
    forall uint32 j.
    (i < j && j < numCheckpointsTotalSupply()) => ckptClockTotalSupply(i) < ckptClockTotalSupply(j)
    {
        preserved with (env e) {
            requireInvariant totalCheckpointInThePast(e);
        }
    }

// TODO: forall address a.
invariant checkpointCountLowerThanClock(env e, address a)
    numCheckpoints(a) <= assert_uint32(clock(e))
    {
        preserved {
            require clockSanity(e);
            requireInvariant checkpointInThePast(e, a);
        }
    }

invariant totalCheckpointCountLowerThanClock(env e)
    numCheckpointsTotalSupply() <= assert_uint32(clock(e))
    {
        preserved {
            require clockSanity(e);
            requireInvariant totalCheckpointInThePast(e);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: totalSupply is checkpointed                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant totalSupplyTracked()
    totalSupply() > 0 => numCheckpointsTotalSupply() > 0;

invariant totalSupplyLatest()
    numCheckpointsTotalSupply() > 0 => totalSupply() == assert_uint256(ckptVotesTotalSupply(require_uint32(numCheckpointsTotalSupply() - 1)))
    {
        preserved {
            requireInvariant totalSupplyTracked();
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Delegate must have a checkpoint                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// WIP
// invariant delegateHasCheckpoint(address a)
//     (balanceOf(a) > 0 && delegates(a) != 0) => numCheckpoints(delegates(a)) > 0
//     {
//         preserved delegate(address delegatee) with (env e) {
//             require numCheckpoints(delegatee) < max_uint256;
//         }
//         preserved delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) with (env e) {
//             require numCheckpoints(delegatee) < max_uint256;
//         }
//     }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Checkpoints are immutables                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule checkpointsImmutable(env e, method f)
    filtered { f -> !f.isView }
{
    address account;
    uint32  index;

    require clockSanity(e);
    requireInvariant checkpointCountLowerThanClock(e, account);

    uint224 valueBefore = ckptVotes(account, index);
    uint32  clockBefore = ckptClock(account, index);

    calldataarg args; f(e, args);

    uint224 valueAfter = ckptVotes@withrevert(account, index);
    assert !lastReverted;
    uint32  clockAfter = ckptClock@withrevert(account, index);
    assert !lastReverted;

    assert clockAfter == clockBefore;
    assert valueAfter != valueBefore => clockBefore == assert_uint32(clock(e));
}

rule totalCheckpointsImmutable(env e, method f)
    filtered { f -> !f.isView }
{
    uint32 index;

    require clockSanity(e);
    requireInvariant totalCheckpointCountLowerThanClock(e);

    uint224 valueBefore = ckptVotesTotalSupply(index);
    uint32  clockBefore = ckptClockTotalSupply(index);

    calldataarg args; f(e, args);

    uint224 valueAfter = ckptVotesTotalSupply@withrevert(index);
    assert !lastReverted;
    uint32  clockAfter = ckptClockTotalSupply@withrevert(index);
    assert !lastReverted;

    assert clockAfter == clockBefore;
    assert valueAfter != valueBefore => clockBefore == assert_uint32(clock(e));
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: what function can lead to state changes                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule changes(env e, method f)
    filtered { f -> !f.isView }
{
    address account;

    require clockSanity(e);

    uint32  ckptsBefore     = numCheckpoints(account);
    uint256 votesBefore     = getVotes(account);
    address delegatesBefore = delegates(account);

    calldataarg args; f(e, args);

    uint32  ckptsAfter     = numCheckpoints(account);
    uint256 votesAfter     = getVotes(account);
    address delegatesAfter = delegates(account);

    assert ckptsAfter != ckptsBefore => (
        ckptsAfter == assert_uint32(ckptsBefore + 1) &&
        ckptClock(account, ckptsBefore) == assert_uint32(clock(e)) &&
        (
            f.selector == sig:mint(address,uint256).selector ||
            f.selector == sig:burn(address,uint256).selector ||
            f.selector == sig:transfer(address,uint256).selector ||
            f.selector == sig:transferFrom(address,address,uint256).selector ||
            f.selector == sig:delegate(address).selector ||
            f.selector == sig:delegateBySig(address,uint256,uint256,uint8,bytes32,bytes32).selector
        )
    );

    assert votesAfter != votesBefore => (
        f.selector == sig:mint(address,uint256).selector ||
        f.selector == sig:burn(address,uint256).selector ||
        f.selector == sig:transfer(address,uint256).selector ||
        f.selector == sig:transferFrom(address,address,uint256).selector ||
        f.selector == sig:delegate(address).selector ||
        f.selector == sig:delegateBySig(address,uint256,uint256,uint8,bytes32,bytes32).selector
    );

    assert delegatesAfter != delegatesBefore => (
        f.selector == sig:delegate(address).selector ||
        f.selector == sig:delegateBySig(address,uint256,uint256,uint8,bytes32,bytes32).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: mint updates votes                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
/* WIP
rule mint(env e) {
    requireInvariant totalSupplyIsSumOfBalances();
    requireInvariant totalSupplyTracked();
    requireInvariant totalSupplyLatest();
    require nonpayable(e);

    address to;
    address toDelegate = delegates(to);
    address other;
    uint256 amount;

    // cache state
    uint256 totalSupplyBefore = totalSupply();
    uint256 votesBefore       = getVotes(toDelegate);
    uint32  ckptsBefore       = numCheckpoints(toDelegate);
    mathint clockBefore       = ckptsBefore == 0 ? -1 : numCheckpoints(toDelegate);
    uint256 otherVotesBefore  = getVotes(other);
    uint256 otherCkptsBefore  = numCheckpoints(other);

    // run transaction
    mint@withrevert(e, to, amount);
    bool success = !lastReverted;

    uint256 votesAfter      = getVotes(toDelegate);
    uint32  ckptsAfter      = numCheckpoints(toDelegate);
    mathint clockAfter      = ckptsAfter == 0 ? -1 : numCheckpoints(toDelegate);
    uint256 otherVotesAfter = getVotes(other);
    uint256 otherCkptsAfter = numCheckpoints(other);

    // liveness
    assert success <=> (to != 0 || totalSupplyBefore + amount <= max_uint256);

    // effects
    assert (
        success &&
        toDelegate != 0
    ) => (
        votesAfter == votesBefore + amount &&
        ckptsAfter == ckptsBefore + to_mathint(clockBefore == clockAfter ? 0 : 1) &&
        clockAfter == clock(e)
    );

    // no side effects
    assert otherVotesAfter != otherVotesBefore => other == toDelegate;
    assert otherCkptsAfter != otherCkptsBefore => other == toDelegate;
}
*/
/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: burn updates votes                                                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
/* WIP
rule burn(env e) {
    requireInvariant totalSupplyIsSumOfBalances();
    requireInvariant totalSupplyTracked();
    requireInvariant totalSupplyLatest();
    require nonpayable(e);

    address from;
    address fromDelegate = delegates(from);
    address other;
    uint256 amount;

    // cache state
    uint256 fromBalanceBefore = balanceOf(from);
    uint256 votesBefore       = getVotes(fromDelegate);
    uint32  ckptsBefore       = numCheckpoints(fromDelegate);
    mathint clockBefore       = ckptsBefore == 0 ? -1 : numCheckpoints(fromDelegate);
    uint256 otherVotesBefore  = getVotes(other);
    uint256 otherCkptsBefore  = numCheckpoints(other);

    // run transaction
    burn@withrevert(e, from, amount);
    bool success = !lastReverted;

    uint256 votesAfter      = getVotes(fromDelegate);
    uint32  ckptsAfter      = numCheckpoints(fromDelegate);
    mathint clockAfter      = ckptsAfter == 0 ? -1 : numCheckpoints(fromDelegate);
    uint256 otherVotesAfter = getVotes(other);
    uint256 otherCkptsAfter = numCheckpoints(other);

    // liveness
    assert success <=> (from != 0 || amount <= fromBalanceBefore);

    // effects
    assert (
        success &&
        fromDelegate != 0
    ) => (
        votesAfter == votesBefore + amount &&
        ckptsAfter == ckptsBefore + to_mathint(clockBefore == clockAfter ? 0 : 1) &&
        clockAfter == clock(e)
    );

    // no side effects
    assert otherVotesAfter != otherVotesBefore => other == fromDelegate;
    assert otherCkptsAfter != otherCkptsBefore => other == fromDelegate;
}
*/