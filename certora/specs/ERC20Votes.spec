import "helpers.spec"
import "methods/IERC20.spec"
import "methods/IERC5805.spec"
import "methods/IERC6372.spec"

methods {
    numCheckpoints(address)          returns (uint32)  envfree
    ckptFromBlock(address, uint32)   returns (uint32)  envfree
    ckptVotes(address, uint32)       returns (uint224) envfree
    numCheckpointsTotalSupply()      returns (uint32)  envfree
    ckptFromBlockTotalSupply(uint32) returns (uint32)  envfree
    ckptVotesTotalSupply(uint32)     returns (uint224) envfree
    maxSupply()                      returns (uint224) envfree
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition max_uint224() returns uint224 = 0xffffffffffffffffffffffffffff;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks: total delegated                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
// copied from ERC20.spec (can't be imported because of hook conflicts)
ghost sumOfBalances() returns uint256 {
  init_state axiom sumOfBalances() == 0;
}

ghost mapping(address => uint256) balanceOf {
    init_state axiom forall address a. balanceOf[a] == 0;
}

ghost mapping(address => address) delegates {
    init_state axiom forall address a. delegates[a] == 0;
}

ghost mapping(address => uint256) getVotes {
    init_state axiom forall address a. getVotes[a] == 0;
}

hook Sstore _balances[KEY address account] uint256 newAmount (uint256 oldAmount) STORAGE {
    // copied from ERC20.spec (can't be imported because of hook conflicts)
    havoc sumOfBalances assuming sumOfBalances@new() == sumOfBalances@old() + newAmount - oldAmount;

    balanceOf[account] = newAmount;
    getVotes[delegates[account]] = getVotes[delegates[account]] + newAmount - oldAmount;
}

hook Sstore _delegates[KEY address account] address newDelegate (address oldDelegate) STORAGE {
    delegates[account] = newDelegate;
    getVotes[oldDelegate] = getVotes[oldDelegate] - balanceOf[account];
    getVotes[newDelegate] = getVotes[newDelegate] + balanceOf[account];
}

// all votes (total supply) minus the votes balances delegated to 0
definition totalVotes() returns uint256 = sumOfBalances() - getVotes[0];

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: copied from ERC20.spec (can't be imported because of hook conflicts)                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant totalSupplyIsSumOfBalances()
    totalSupply() == sumOfBalances() &&
    totalSupply() <= max_uint256

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: clock                                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant clockMode(env e)
    clock(e) == e.block.number || clock(e) == e.block.timestamp

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: zero address has no delegate, no votes and no checkpoints                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant zeroConsistency()
    delegates(0) == 0 &&
    getVotes(0) == 0 &&
    numCheckpoints(0) == 0
    {
        preserved with (env e) {
            // we assume address 0 cannot perform any call
            require e.msg.sender != 0;
        }
    }

// WIP
invariant delegateHasCheckpoint(address a)
    (balanceOf(a) > 0 && delegates(a) != 0) => numCheckpoints(delegates(a)) > 0
    {
        preserved delegate(address delegatee) with (env e) {
            require numCheckpoints(delegatee) < max_uint256;
        }
        preserved delegateBySig(address delegatee, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) with (env e) {
            require numCheckpoints(delegatee) < max_uint256;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: hook correctly track latest checkpoint                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant balanceAndDelegationConsistency(address a)
    balanceOf(a) == balanceOf[a] &&
    delegates(a) == delegates[a]

// WIP
invariant votesConsistency(address a)
    a != 0 => getVotes(a) == getVotes[a]

// WIP
invariant voteBiggerThanDelegatedBalances(address a)
    getVotes(delegates(a)) >= balanceOf(a)
    {
        preserved {
            requireInvariant zeroConsistency();
        }
    }

// WIP
invariant userVotesLessTotalVotes(address a)
    numCheckpoints(a) > 0 => getVotes(a) <= totalVotes()
    {
        preserved {
            requireInvariant totalSupplyIsSumOfBalances;
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: totalSupply is checkpointed                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant totalSupplyTracked()
    totalSupply() > 0 => numCheckpointsTotalSupply() > 0

invariant totalSupplyLatest()
    numCheckpointsTotalSupply() > 0 => ckptVotesTotalSupply(numCheckpointsTotalSupply() - 1) == totalSupply()

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: checkpoint is not in the future                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant checkpointInThePast(env e, address a)
    numCheckpoints(a) > 0 => ckptFromBlock(a, numCheckpoints(a) - 1) <= clock(e)
    {
        preserved with (env e2) {
            require clock(e2) <= clock(e);
        }
    }

invariant totalCheckpointInThePast(env e)
    numCheckpointsTotalSupply() > 0 => ckptFromBlockTotalSupply(numCheckpointsTotalSupply() - 1) <= clock(e)
    {
        preserved with (env e2) {
            require clock(e2) <= clock(e);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: checkpoint clock is strictly increassing (implies no duplicate)                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant checkpointClockIncreassing(address a)
    numCheckpoints(a) > 1 => ckptFromBlock(a, numCheckpoints(a) - 2) < ckptFromBlock(a, numCheckpoints(a) - 1)
    {
        preserved with (env e) {
            requireInvariant checkpointInThePast(e, a);
        }
    }

invariant totalCheckpointClockIncreassing()
    numCheckpointsTotalSupply() > 1 => ckptFromBlockTotalSupply(numCheckpointsTotalSupply() - 2) < ckptFromBlockTotalSupply(numCheckpointsTotalSupply() - 1)
    {
        preserved with (env e) {
            requireInvariant totalCheckpointInThePast(e);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: Don't track votes delegated to address 0                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule checkpointsImmutable(env e, method f)
    filtered { f -> !f.isView }
{
    address account;
    uint32  index;

    require index < numCheckpoints(account);
    uint224 valueBefore = ckptVotes(account, index);
    uint32  clockBefore = ckptFromBlock(account, index);

    calldataarg args; f(e, args);

    uint224 valueAfter = ckptVotes@withrevert(account, index);
    assert !lastReverted;
    uint32  clockAfter = ckptFromBlock@withrevert(account, index);
    assert !lastReverted;

    assert clockAfter == clockBefore;
    assert valueAfter != valueBefore => clockBefore == clock(e);
}

rule totalCheckpointsImmutable(env e, method f)
    filtered { f -> !f.isView }
{
    uint32  index;

    require index < numCheckpointsTotalSupply();
    uint224 valueBefore = ckptVotesTotalSupply(index);
    uint32  clockBefore = ckptFromBlockTotalSupply(index);

    calldataarg args; f(e, args);

    uint224 valueAfter = ckptVotesTotalSupply@withrevert(index);
    assert !lastReverted;
    uint32  clockAfter = ckptFromBlockTotalSupply@withrevert(index);
    assert !lastReverted;

    assert clockAfter == clockBefore;
    assert valueAfter != valueBefore => clockBefore == clock(e);
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
    calldataarg args;

    uint32  ckptsBefore     = numCheckpoints(account);
    uint256 votesBefore     = getVotes(account);
    address delegatesBefore = delegates(account);

    f(e, args);

    uint32  ckptsAfter     = numCheckpoints(account);
    uint256 votesAfter     = getVotes(account);
    address delegatesAfter = delegates(account);

    assert ckptsAfter != ckptsBefore => (
        ckptsAfter == ckptsBefore + 1 &&
        ckptFromBlock(account, ckptsAfter - 1) == clock(e) &&
        (
            f.selector == mint(address,uint256).selector ||
            f.selector == burn(address,uint256).selector ||
            f.selector == transfer(address,uint256).selector ||
            f.selector == transferFrom(address,address,uint256).selector ||
            f.selector == delegate(address).selector ||
            f.selector == delegateBySig(address,uint256,uint256,uint8,bytes32,bytes32).selector
        )
    );

    assert votesAfter != votesBefore => (
        f.selector == mint(address,uint256).selector ||
        f.selector == burn(address,uint256).selector ||
        f.selector == transfer(address,uint256).selector ||
        f.selector == transferFrom(address,address,uint256).selector ||
        f.selector == delegate(address).selector ||
        f.selector == delegateBySig(address,uint256,uint256,uint8,bytes32,bytes32).selector
    );

    assert delegatesAfter != delegatesBefore => (
        f.selector == delegate(address).selector ||
        f.selector == delegateBySig(address,uint256,uint256,uint8,bytes32,bytes32).selector
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