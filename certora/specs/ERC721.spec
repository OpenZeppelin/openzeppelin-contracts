import "helpers/helpers.spec";
import "methods/IERC721.spec";
import "methods/IERC721Receiver.spec";

methods {
    // exposed for FV
    function mint(address,uint256) external;
    function safeMint(address,uint256) external;
    function safeMint(address,uint256,bytes) external;
    function burn(uint256) external;

    function unsafeOwnerOf(uint256) external returns (address) envfree;
    function unsafeGetApproved(uint256) external returns (address) envfree;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

definition authSanity(env e) returns bool = e.msg.sender != 0;

// Could be broken in theory, but not in practice
definition balanceLimited(address account) returns bool = balanceOf(account) < max_uint256;

function helperTransferWithRevert(env e, method f, address from, address to, uint256 tokenId) {
    if (f.selector == sig:transferFrom(address,address,uint256).selector) {
        transferFrom@withrevert(e, from, to, tokenId);
    } else if (f.selector == sig:safeTransferFrom(address,address,uint256).selector) {
        safeTransferFrom@withrevert(e, from, to, tokenId);
    } else if (f.selector == sig:safeTransferFrom(address,address,uint256,bytes).selector) {
        bytes params;
        require params.length < 0xffff;
        safeTransferFrom@withrevert(e, from, to, tokenId, params);
    } else {
        calldataarg args;
        f@withrevert(e, args);
    }
}

function helperMintWithRevert(env e, method f, address to, uint256 tokenId) {
    if (f.selector == sig:mint(address,uint256).selector) {
        mint@withrevert(e, to, tokenId);
    } else if (f.selector == sig:safeMint(address,uint256).selector) {
        safeMint@withrevert(e, to, tokenId);
    } else if (f.selector == sig:safeMint(address,uint256,bytes).selector) {
        bytes params;
        require params.length < 0xffff;
        safeMint@withrevert(e, to, tokenId, params);
    } else {
        require false;
    }
}

function helperSoundFnCall(env e, method f) {
    if (f.selector == sig:mint(address,uint256).selector) {
        address to; uint256 tokenId;
        require balanceLimited(to);
        requireInvariant notMintedUnset(tokenId);
        mint(e, to, tokenId);
    } else if (f.selector == sig:safeMint(address,uint256).selector) {
        address to; uint256 tokenId;
        require balanceLimited(to);
        requireInvariant notMintedUnset(tokenId);
        safeMint(e, to, tokenId);
    } else if (f.selector == sig:safeMint(address,uint256,bytes).selector) {
        address to; uint256 tokenId; bytes data;
        require data.length < 0xffff;
        require balanceLimited(to);
        requireInvariant notMintedUnset(tokenId);
        safeMint(e, to, tokenId, data);
    } else if (f.selector == sig:burn(uint256).selector) {
        uint256 tokenId;
        requireInvariant ownerHasBalance(tokenId);
        requireInvariant notMintedUnset(tokenId);
        burn(e, tokenId);
    } else if (f.selector == sig:transferFrom(address,address,uint256).selector) {
        address from; address to; uint256 tokenId;
        require balanceLimited(to);
        requireInvariant ownerHasBalance(tokenId);
        requireInvariant notMintedUnset(tokenId);
        transferFrom(e, from, to, tokenId);
    } else if (f.selector == sig:safeTransferFrom(address,address,uint256).selector) {
        address from; address to; uint256 tokenId;
        require balanceLimited(to);
        requireInvariant ownerHasBalance(tokenId);
        requireInvariant notMintedUnset(tokenId);
        safeTransferFrom(e, from, to, tokenId);
    } else if (f.selector == sig:safeTransferFrom(address,address,uint256,bytes).selector) {
        address from; address to; uint256 tokenId; bytes data;
        require data.length < 0xffff;
        require balanceLimited(to);
        requireInvariant ownerHasBalance(tokenId);
        requireInvariant notMintedUnset(tokenId);
        safeTransferFrom(e, from, to, tokenId, data);
    } else {
        calldataarg args;
        f(e, args);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks: ownership count                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost mathint _ownedTotal {
    init_state axiom _ownedTotal == 0;
}

ghost mapping(address => mathint) _ownedByUser {
    init_state axiom forall address a. _ownedByUser[a] == 0;
}

hook Sstore _owners[KEY uint256 tokenId] address newOwner (address oldOwner) STORAGE {
    _ownedByUser[newOwner] = _ownedByUser[newOwner] + to_mathint(newOwner != 0 ? 1 : 0);
    _ownedByUser[oldOwner] = _ownedByUser[oldOwner] - to_mathint(oldOwner != 0 ? 1 : 0);
    _ownedTotal = _ownedTotal + to_mathint(newOwner != 0 ? 1 : 0) - to_mathint(oldOwner != 0 ? 1 : 0);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks: sum of all balances                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost mathint _supply {
    init_state axiom _supply == 0;
}

ghost mapping(address => mathint) _balances {
    init_state axiom forall address a. _balances[a] == 0;
}

hook Sstore _balances[KEY address addr] uint256 newValue (uint256 oldValue) STORAGE {
    _supply = _supply - oldValue + newValue;
}

// TODO: This used to not be necessary. We should try to remove it. In order to do so, we will probably need to add
// many "preserved" directive that require the "balanceOfConsistency" invariant on the accounts involved.
hook Sload uint256 value _balances[KEY address user] STORAGE {
    require _balances[user] == to_mathint(value);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: number of owned tokens is the sum of all balances                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant ownedTotalIsSumOfBalances()
    _ownedTotal == _supply
    {
        preserved mint(address to, uint256 tokenId) with (env e) {
            require balanceLimited(to);
        }
        preserved safeMint(address to, uint256 tokenId) with (env e) {
            require balanceLimited(to);
        }
        preserved safeMint(address to, uint256 tokenId, bytes data) with (env e) {
            require balanceLimited(to);
        }
        preserved burn(uint256 tokenId) with (env e) {
            requireInvariant ownerHasBalance(tokenId);
            requireInvariant balanceOfConsistency(ownerOf(tokenId));
        }
        preserved transferFrom(address from, address to, uint256 tokenId) with (env e) {
            require balanceLimited(to);
            requireInvariant ownerHasBalance(tokenId);
            requireInvariant balanceOfConsistency(from);
            requireInvariant balanceOfConsistency(to);
        }
        preserved safeTransferFrom(address from, address to, uint256 tokenId) with (env e) {
            require balanceLimited(to);
            requireInvariant ownerHasBalance(tokenId);
            requireInvariant balanceOfConsistency(from);
            requireInvariant balanceOfConsistency(to);
        }
        preserved safeTransferFrom(address from, address to, uint256 tokenId, bytes data) with (env e) {
            require balanceLimited(to);
            requireInvariant ownerHasBalance(tokenId);
            requireInvariant balanceOfConsistency(from);
            requireInvariant balanceOfConsistency(to);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: balanceOf is the number of tokens owned                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant balanceOfConsistency(address user)
    to_mathint(balanceOf(user)) == _ownedByUser[user] &&
    to_mathint(balanceOf(user)) == _balances[user]
    {
        preserved {
            require balanceLimited(user);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: owner of a token must have some balance                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant ownerHasBalance(uint256 tokenId)
    balanceOf(ownerOf(tokenId)) > 0
    {
        preserved {
            requireInvariant balanceOfConsistency(ownerOf(tokenId));
            require balanceLimited(ownerOf(tokenId));
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: balance of address(0) is 0                                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule zeroAddressBalanceRevert() {
    balanceOf@withrevert(0);
    assert lastReverted;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: address(0) has no authorized operator                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant zeroAddressHasNoApprovedOperator(address a)
    !isApprovedForAll(0, a)
    {
        preserved with (env e) {
            require nonzerosender(e);
        }
    }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: tokens that do not exist are not owned and not approved                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant notMintedUnset(uint256 tokenId)
    unsafeOwnerOf(tokenId) == 0 => unsafeGetApproved(tokenId) == 0;

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: unsafeOwnerOf and unsafeGetApproved don't revert + ownerOf and getApproved revert if token does not exist     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule notMintedRevert(uint256 tokenId) {
    requireInvariant notMintedUnset(tokenId);

    address _owner = unsafeOwnerOf@withrevert(tokenId);
    assert !lastReverted;

    address _approved = unsafeGetApproved@withrevert(tokenId);
    assert !lastReverted;

    address owner = ownerOf@withrevert(tokenId);
    assert lastReverted <=> _owner == 0;
    assert !lastReverted => _owner == owner;

    address approved = getApproved@withrevert(tokenId);
    assert lastReverted <=> _owner == 0;
    assert !lastReverted => _approved == approved;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: total supply can only change through mint and burn                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule supplyChange(env e) {
    require nonzerosender(e);
    requireInvariant zeroAddressHasNoApprovedOperator(e.msg.sender);

    mathint supplyBefore = _supply;
    method f; helperSoundFnCall(e, f);
    mathint supplyAfter = _supply;

    assert supplyAfter > supplyBefore => (
        supplyAfter == supplyBefore + 1 &&
        (
            f.selector == sig:mint(address,uint256).selector ||
            f.selector == sig:safeMint(address,uint256).selector ||
            f.selector == sig:safeMint(address,uint256,bytes).selector
        )
    );
    assert supplyAfter < supplyBefore => (
        supplyAfter == supplyBefore - 1 &&
        f.selector == sig:burn(uint256).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: balanceOf can only change through mint, burn or transfers. balanceOf cannot change by more than 1.           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule balanceChange(env e, address account) {
    requireInvariant balanceOfConsistency(account);
    require balanceLimited(account);

    mathint balanceBefore = balanceOf(account);
    method f; helperSoundFnCall(e, f);
    mathint balanceAfter  = balanceOf(account);

    // balance can change by at most 1
    assert balanceBefore != balanceAfter => (
        balanceAfter == balanceBefore - 1 ||
        balanceAfter == balanceBefore + 1
    );

    // only selected function can change balances
    assert balanceBefore != balanceAfter => (
        f.selector == sig:transferFrom(address,address,uint256).selector ||
        f.selector == sig:safeTransferFrom(address,address,uint256).selector ||
        f.selector == sig:safeTransferFrom(address,address,uint256,bytes).selector ||
        f.selector == sig:mint(address,uint256).selector ||
        f.selector == sig:safeMint(address,uint256).selector ||
        f.selector == sig:safeMint(address,uint256,bytes).selector ||
        f.selector == sig:burn(uint256).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: ownership can only change through mint, burn or transfers.                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule ownershipChange(env e, uint256 tokenId) {
    require nonzerosender(e);
    requireInvariant zeroAddressHasNoApprovedOperator(e.msg.sender);

    address ownerBefore = unsafeOwnerOf(tokenId);
    method f; helperSoundFnCall(e, f);
    address ownerAfter  = unsafeOwnerOf(tokenId);

    assert ownerBefore == 0 && ownerAfter != 0 => (
        f.selector == sig:mint(address,uint256).selector ||
        f.selector == sig:safeMint(address,uint256).selector ||
        f.selector == sig:safeMint(address,uint256,bytes).selector
    );

    assert ownerBefore != 0 && ownerAfter == 0 => (
        f.selector == sig:burn(uint256).selector
    );

    assert (ownerBefore != ownerAfter && ownerBefore != 0 && ownerAfter != 0) => (
        f.selector == sig:transferFrom(address,address,uint256).selector ||
        f.selector == sig:safeTransferFrom(address,address,uint256).selector ||
        f.selector == sig:safeTransferFrom(address,address,uint256,bytes).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: token approval can only change through approve or transfers (implicitly).                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule approvalChange(env e, uint256 tokenId) {
    address approvalBefore = unsafeGetApproved(tokenId);
    method f; helperSoundFnCall(e, f);
    address approvalAfter  = unsafeGetApproved(tokenId);

    // approve can set any value, other functions reset
    assert approvalBefore != approvalAfter => (
        f.selector == sig:approve(address,uint256).selector ||
        (
            (
                f.selector == sig:transferFrom(address,address,uint256).selector ||
                f.selector == sig:safeTransferFrom(address,address,uint256).selector ||
                f.selector == sig:safeTransferFrom(address,address,uint256,bytes).selector ||
                f.selector == sig:burn(uint256).selector
            ) && approvalAfter == 0
        )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: approval for all tokens can only change through isApprovedForAll.                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule approvedForAllChange(env e, address owner, address spender) {
    bool approvedForAllBefore = isApprovedForAll(owner, spender);
    method f; helperSoundFnCall(e, f);
    bool approvedForAllAfter  = isApprovedForAll(owner, spender);

    assert approvedForAllBefore != approvedForAllAfter => f.selector == sig:setApprovalForAll(address,bool).selector;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: transferFrom behavior and side effects                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transferFrom(env e, address from, address to, uint256 tokenId) {
    require nonpayable(e);
    require authSanity(e);

    address operator = e.msg.sender;
    uint256 otherTokenId;
    address otherAccount;

    requireInvariant ownerHasBalance(tokenId);
    require balanceLimited(to);

    uint256 balanceOfFromBefore  = balanceOf(from);
    uint256 balanceOfToBefore    = balanceOf(to);
    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
    address ownerBefore          = unsafeOwnerOf(tokenId);
    address otherOwnerBefore     = unsafeOwnerOf(otherTokenId);
    address approvalBefore       = unsafeGetApproved(tokenId);
    address otherApprovalBefore  = unsafeGetApproved(otherTokenId);

    transferFrom@withrevert(e, from, to, tokenId);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        from == ownerBefore &&
        from != 0 &&
        to   != 0 &&
        (operator == from || operator == approvalBefore || isApprovedForAll(ownerBefore, operator))
    );

    // effect
    assert success => (
        to_mathint(balanceOf(from))            == balanceOfFromBefore - assert_uint256(from != to ? 1 : 0) &&
        to_mathint(balanceOf(to))              == balanceOfToBefore   + assert_uint256(from != to ? 1 : 0) &&
        unsafeOwnerOf(tokenId)                 == to &&
        unsafeGetApproved(tokenId)             == 0
    );

    // no side effect
    assert balanceOf(otherAccount)         != balanceOfOtherBefore => (otherAccount == from || otherAccount == to);
    assert unsafeOwnerOf(otherTokenId)     != otherOwnerBefore     => otherTokenId == tokenId;
    assert unsafeGetApproved(otherTokenId) != otherApprovalBefore  => otherTokenId == tokenId;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: safeTransferFrom behavior and side effects                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule safeTransferFrom(env e, method f, address from, address to, uint256 tokenId) filtered { f ->
    f.selector == sig:safeTransferFrom(address,address,uint256).selector ||
    f.selector == sig:safeTransferFrom(address,address,uint256,bytes).selector
} {
    require nonpayable(e);
    require authSanity(e);

    address operator = e.msg.sender;
    uint256 otherTokenId;
    address otherAccount;

    requireInvariant ownerHasBalance(tokenId);
    require balanceLimited(to);

    uint256 balanceOfFromBefore  = balanceOf(from);
    uint256 balanceOfToBefore    = balanceOf(to);
    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
    address ownerBefore          = unsafeOwnerOf(tokenId);
    address otherOwnerBefore     = unsafeOwnerOf(otherTokenId);
    address approvalBefore       = unsafeGetApproved(tokenId);
    address otherApprovalBefore  = unsafeGetApproved(otherTokenId);

    helperTransferWithRevert(e, f, from, to, tokenId);
    bool success = !lastReverted;

    assert success <=> (
        from == ownerBefore &&
        from != 0 &&
        to   != 0 &&
        (operator == from || operator == approvalBefore || isApprovedForAll(ownerBefore, operator))
    );

    // effect
    assert success => (
        to_mathint(balanceOf(from)) == balanceOfFromBefore - assert_uint256(from != to ? 1: 0) &&
        to_mathint(balanceOf(to))   == balanceOfToBefore   + assert_uint256(from != to ? 1: 0) &&
        unsafeOwnerOf(tokenId)      == to &&
        unsafeGetApproved(tokenId)  == 0
    );

    // no side effect
    assert balanceOf(otherAccount)         != balanceOfOtherBefore => (otherAccount == from || otherAccount == to);
    assert unsafeOwnerOf(otherTokenId)     != otherOwnerBefore     => otherTokenId == tokenId;
    assert unsafeGetApproved(otherTokenId) != otherApprovalBefore  => otherTokenId == tokenId;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: mint behavior and side effects                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule mint(env e, address to, uint256 tokenId) {
    require nonpayable(e);
    requireInvariant notMintedUnset(tokenId);

    uint256 otherTokenId;
    address otherAccount;

    require balanceLimited(to);

    mathint supplyBefore         = _supply;
    uint256 balanceOfToBefore    = balanceOf(to);
    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
    address ownerBefore          = unsafeOwnerOf(tokenId);
    address otherOwnerBefore     = unsafeOwnerOf(otherTokenId);

    mint@withrevert(e, to, tokenId);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        ownerBefore == 0 &&
        to != 0
    );

    // effect
    assert success => (
        _supply                   == supplyBefore + 1 &&
        to_mathint(balanceOf(to)) == balanceOfToBefore + 1 &&
        unsafeOwnerOf(tokenId)    == to
    );

    // no side effect
    assert balanceOf(otherAccount)     != balanceOfOtherBefore => otherAccount == to;
    assert unsafeOwnerOf(otherTokenId) != otherOwnerBefore     => otherTokenId == tokenId;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: safeMint behavior and side effects                                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule safeMint(env e, method f, address to, uint256 tokenId) filtered { f ->
    f.selector == sig:safeMint(address,uint256).selector ||
    f.selector == sig:safeMint(address,uint256,bytes).selector
} {
    require nonpayable(e);
    requireInvariant notMintedUnset(tokenId);

    uint256 otherTokenId;
    address otherAccount;

    require balanceLimited(to);

    mathint supplyBefore         = _supply;
    uint256 balanceOfToBefore    = balanceOf(to);
    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
    address ownerBefore          = unsafeOwnerOf(tokenId);
    address otherOwnerBefore     = unsafeOwnerOf(otherTokenId);

    helperMintWithRevert(e, f, to, tokenId);
    bool success = !lastReverted;

    assert success <=> (
        ownerBefore == 0 &&
        to != 0
    );

    // effect
    assert success => (
        _supply                   == supplyBefore + 1 &&
        to_mathint(balanceOf(to)) == balanceOfToBefore + 1 &&
        unsafeOwnerOf(tokenId)    == to
    );

    // no side effect
    assert balanceOf(otherAccount)     != balanceOfOtherBefore => otherAccount == to;
    assert unsafeOwnerOf(otherTokenId) != otherOwnerBefore     => otherTokenId == tokenId;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: burn behavior and side effects                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule burn(env e, uint256 tokenId) {
    require nonpayable(e);

    address from = unsafeOwnerOf(tokenId);
    uint256 otherTokenId;
    address otherAccount;

    requireInvariant ownerHasBalance(tokenId);

    mathint supplyBefore         = _supply;
    uint256 balanceOfFromBefore  = balanceOf(from);
    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
    address ownerBefore          = unsafeOwnerOf(tokenId);
    address otherOwnerBefore     = unsafeOwnerOf(otherTokenId);
    address otherApprovalBefore  = unsafeGetApproved(otherTokenId);

    burn@withrevert(e, tokenId);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        ownerBefore != 0
    );

    // effect
    assert success => (
        _supply                     == supplyBefore - 1 &&
        to_mathint(balanceOf(from)) == balanceOfFromBefore - 1 &&
        unsafeOwnerOf(tokenId)      == 0 &&
        unsafeGetApproved(tokenId)  == 0
    );

    // no side effect
    assert balanceOf(otherAccount)         != balanceOfOtherBefore => otherAccount == from;
    assert unsafeOwnerOf(otherTokenId)     != otherOwnerBefore     => otherTokenId == tokenId;
    assert unsafeGetApproved(otherTokenId) != otherApprovalBefore  => otherTokenId == tokenId;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: approve behavior and side effects                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule approve(env e, address spender, uint256 tokenId) {
    require nonpayable(e);
    require authSanity(e);

    address caller = e.msg.sender;
    address owner = unsafeOwnerOf(tokenId);
    uint256 otherTokenId;

    address otherApprovalBefore  = unsafeGetApproved(otherTokenId);

    approve@withrevert(e, spender, tokenId);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        owner != 0 &&
        (owner == caller || isApprovedForAll(owner, caller))
    );

    // effect
    assert success => unsafeGetApproved(tokenId) == spender;

    // no side effect
    assert unsafeGetApproved(otherTokenId) != otherApprovalBefore  => otherTokenId == tokenId;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: setApprovalForAll behavior and side effects                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule setApprovalForAll(env e, address operator, bool approved) {
    require nonpayable(e);

    address owner = e.msg.sender;
    address otherOwner;
    address otherOperator;

    bool otherIsApprovedForAllBefore = isApprovedForAll(otherOwner, otherOperator);

    setApprovalForAll@withrevert(e, operator, approved);
    bool success = !lastReverted;

    // liveness
    assert success <=> operator != 0;

    // effect
    assert success => isApprovedForAll(owner, operator) == approved;

    // no side effect
    assert isApprovedForAll(otherOwner, otherOperator) != otherIsApprovedForAllBefore => (
        otherOwner    == owner &&
        otherOperator == operator
    );
}
