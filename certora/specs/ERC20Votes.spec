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
│ Ghost: user (current) voting weight                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost lastUserVotes(address) returns uint224 {
    init_state axiom forall address a. lastUserVotes(a) == 0;
}

ghost userCkptNumber(address) returns uint32 {
    init_state axiom forall address a. userCkptNumber(a) == 0;
}

ghost lastUserIndex(address) returns uint32;
ghost lastUserTimepoint(address) returns uint32;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost: total voting weight                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost totalVotes() returns uint224 {
    init_state axiom totalVotes() == 0;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost: duplicate checkpoint detection                                                                               │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost lastUserDuplicate(address) returns bool {
    init_state axiom forall address a. lastUserDuplicate(a) == false;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Hook                                                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
hook Sstore currentContract._checkpoints[KEY address account][INDEX uint32 index].votes uint224 newVotes (uint224 oldVotes) STORAGE {
    havoc lastUserVotes assuming
        lastUserVotes@new(account) == newVotes;

    havoc totalVotes assuming
        totalVotes@new() == totalVotes@old() + newVotes - lastUserVotes(account);

    havoc lastUserIndex assuming
        lastUserIndex@new(account) == index;
}

hook Sstore currentContract._checkpoints[KEY address account][INDEX uint32 index].fromBlock uint32 newTimepoint (uint32 oldTimepoint) STORAGE {
    havoc lastUserTimepoint assuming
        lastUserTimepoint@new(account) == newTimepoint;

    havoc userCkptNumber assuming
        userCkptNumber@new(account) == index + 1;

    havoc lastUserDuplicate assuming
        lastUserDuplicate@new(account) == (newTimepoint == lastUserTimepoint(account));

}






definition max_uint224() returns uint224 = 0xffffffffffffffffffffffffffff;




invariant clockMode(env e)
    clock(e) == e.block.number || clock(e) == e.block.timestamp


invariant numCheckpointsConsistency(address a)
    userCkptNumber(a) == numCheckpoints(a) &&
    userCkptNumber(a) <= max_uint32

invariant lastUserVotesAndTimepointConsistency(address a)
    numCheckpoints(a) > 0 => (
        lastUserIndex(a)     == numCheckpoints(a) - 1              &&
        lastUserIndex(a)     <= max_uint32                         &&
        lastUserVotes(a)     == ckptVotes(a, lastUserIndex(a))     &&
        lastUserVotes(a)     <= max_uint224()                      &&
        lastUserTimepoint(a) == ckptFromBlock(a, lastUserIndex(a)) &&
        lastUserTimepoint(a) <= max_uint224()
    )











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