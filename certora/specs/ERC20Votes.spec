import "helpers.spec"
import "methods/IERC20.spec"
import "methods/IERC5805.spec"
import "methods/IERC6372.spec"
import "ERC20.spec"

methods {
    numCheckpoints(address)        returns (uint32)  envfree
    ckptFromBlock(address, uint32) returns (uint32)  envfree
    ckptVotes(address, uint32)     returns (uint224) envfree
    maxSupply()                    returns (uint224) envfree
}

use invariant totalSupplyIsSumOfBalances

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
definition max_uint224() returns uint224 = 0xffffffffffffffffffffffffffff;
definition lastCheckpoint(address a) returns uint32 = to_uint32(numCheckpoints(a) - 1);

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks                                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/


/*
ghost totalVotes() returns uint224 {
    init_state axiom totalVotes() == 0;
}

ghost mapping(address => uint256) userVotes {
    init_state axiom forall address a. userVotes[a] == 0;
}

ghost mapping(address => uint32) userLast {
    init_state axiom forall address a. userLast[a] == 0;
}

ghost mapping(address => uint32) userClock {
    init_state axiom forall address a. userClock[a] == 0;
}

hook Sstore currentContract._checkpoints[KEY address account][INDEX uint32 index].votes uint224 newVotes (uint224 oldVotes) STORAGE {
    havoc totalVotes assuming totalVotes@new() == totalVotes@old() + newVotes - userVotes[account];

    userVotes[account] = newVotes;
    userLast[account] = index;
}

hook Sstore currentContract._checkpoints[KEY address account][INDEX uint32 index].fromBlock uint32 newTimepoint (uint32 oldTimepoint) STORAGE {
    userClock[account] = newTimepoint;
}
*/













/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: clock                                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant clockMode(env e)
    clock(e) == e.block.number || clock(e) == e.block.timestamp






invariant userClockInThePast(env e, address a)
    numCheckpoints(a) > 0 => ckptFromBlock(lastCheckpoint(a)) <= clock(e)
    {
        preserved with (env e2) {
            require clock(e2) <= clock(e);
        }
    }

/*
invariant hooksAreCorrect(env e, address a)
    numCheckpoints(a) > 0 => (
        userLast(a)  == ckptFromBlock(lastCheckpoint(a)) &&
        userVotes(a) == ckptVotes(lastCheckpoint(a))
    )
*/








/*
invariant userVotesAndClockConsistency(address a)
    numCheckpoints(a) > 0 => (
        userLast(a)  == numCheckpoints(a) - 1              &&
        userLast(a)  <= max_uint32                         &&
        userVotes(a) == ckptVotes(a, lastUserIndex(a))     &&
        userVotes(a) <= max_uint224()                      &&
        userClock(a) == ckptFromBlock(a, lastUserIndex(a)) &&
        userClock(a) <= max_uint224()
    )
*/








/*
invariant noDuplicate(address a)
    !lastUserDuplicate(a)

// passes
invariant userVotesOverflow()
    forall address a. lastUserVotes(a) <= max_uint256

invariant userVotes(env e)
    forall address a. userCkptNumber(a) > 0 => lastUserVotes(a) == getVotes(e, a)
    {
        preserved {
            requireInvariant totalSupplyIsSumOfBalances;
        }
    }

invariant userVotesLessTotalVotes()
    forall address a. userCkptNumber(a) > 0 => lastUserVotes(a) <= totalVotes()
    {
        preserved {
            requireInvariant totalSupplyIsSumOfBalances;
        }
    }

// passes
invariant totalVotesLessTotalSupply()
    totalVotes() <= totalSupply()
    {
        preserved {
            requireInvariant totalSupplyIsSumOfBalances;
        }
    }
*/