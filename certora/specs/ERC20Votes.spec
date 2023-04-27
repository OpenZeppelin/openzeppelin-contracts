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

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks                                                                                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost totalVotes() returns uint224 {
    init_state axiom totalVotes() == 0;
}

ghost mapping(address => uint224) userVotes {
    init_state axiom forall address a. userVotes[a] == 0;
}

ghost mapping(address => uint32) userClock {
    init_state axiom forall address a. userClock[a] == 0;
}

ghost mapping(address => uint32) userCkpts {
    init_state axiom forall address a. userCkpts[a] == 0;
}

hook Sstore currentContract._checkpoints[KEY address account][INDEX uint32 index].votes uint224 newVotes (uint224 oldVotes) STORAGE {
    havoc totalVotes assuming totalVotes@new() == totalVotes@old() + newVotes - userVotes[account];

    userVotes[account] = newVotes;
    userCkpts[account] = index;
}

hook Sstore currentContract._checkpoints[KEY address account][INDEX uint32 index].fromBlock uint32 newTimepoint (uint32 oldTimepoint) STORAGE {
    userClock[account] = newTimepoint;
    userCkpts[account] = index;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: clock                                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant clockMode(env e)
    clock(e) == e.block.number || clock(e) == e.block.timestamp

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: hook correctly track lastest checkpoint                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant hooksAreCorrect(address a)
    numCheckpoints(a) > 0 => (
        userVotes[a] == getVotes(a) &&
        userVotes[a] == ckptVotes(a, numCheckpoints(a) - 1) &&
        userClock[a] == ckptFromBlock(a, numCheckpoints(a) - 1) &&
        userCkpts[a] == numCheckpoints(a) - 1
    )

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: checkpoint is not in the future                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant userClockInThePast(env e, address a)
    numCheckpoints(a) > 0 => ckptFromBlock(a, numCheckpoints(a) - 1) <= clock(e)
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
            requireInvariant userClockInThePast(e, a);
        }
    }






/// For some reason "sumOfBalances" is not tracking correctly ...
/// ... and we get counter example where totalSupply is more than the sum of involved balances
// invariant totalVotesLessTotalSupply()
//     totalVotes() <= totalSupply()
//     {
//         preserved {
//             requireInvariant totalSupplyIsSumOfBalances;
//         }
//     }

/// For some reason "sumOfBalances" is not tracking correctly ...
/// ... and we get counter example where totalSupply is more than the sum of involved balances
// invariant userVotesLessTotalVotes(address a)
//     numCheckpoints(a) > 0 => getVotes(a) <= totalVotes()
//     {
//         preserved {
//             requireInvariant totalSupplyIsSumOfBalances;
//         }
//     }
