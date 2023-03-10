import "helpers.spec"
import "methods/IERC721.spec"

methods {
    // exposed for FV
    mint(address,uint256)
    safeMint(address,uint256)
    safeMint(address,uint256,bytes)
    burn(uint256)

    tokenExists(uint256) returns (bool) envfree
    unsafeOwnerOf(uint256) returns (address) envfree
    unsafeGetApproved(uint256) returns (address) envfree
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Helpers                                                                                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/

// Could be broken in theory, but not in practice
function balanceLimited(address account) returns bool {
    return balanceOf(account) < max_uint256;
}

function helperTokenOperationWithRevert(env e, method f, uint256 tokenId) {
    if (f.selector == transferFrom(address,address,uint256).selector) {
        address from; address to;
        transferFrom@withrevert(e, from, to, tokenId);
    } else if (f.selector == safeTransferFrom(address,address,uint256).selector) {
        address from; address to;
        safeTransferFrom@withrevert(e, from, to, tokenId);
    } else if (f.selector == safeTransferFrom(address,address,uint256,bytes).selector) {
        address from; address to; bytes params;
        safeTransferFrom@withrevert(e, from, to, tokenId, params);
    } else if (f.selector == mint(address,uint256).selector) {
        address to;
        mint@withrevert(e, to, tokenId);
    } else if (f.selector == safeMint(address,uint256).selector) {
        address to;
        safeMint@withrevert(e, to, tokenId);
    } else if (f.selector == safeMint(address,uint256,bytes).selector) {
        address to; bytes params;
        safeMint@withrevert(e, to, tokenId, params);
    } else if (f.selector == burn(uint256).selector) {
        burn@withrevert(e, tokenId);
    } else if (f.selector == approve(address,uint256).selector) {
        address spender;
        approve@withrevert(e, spender, tokenId);
    } else {
        calldataarg args;
        f@withrevert(e, args);
    }
}

function helperTransferWithRevert(env e, method f, address from, address to, uint256 tokenId) {
    if (f.selector == transferFrom(address,address,uint256).selector) {
        transferFrom@withrevert(e, from, to, tokenId);
    } else if (f.selector == safeTransferFrom(address,address,uint256).selector) {
        safeTransferFrom@withrevert(e, from, to, tokenId);
    } else if (f.selector == safeTransferFrom(address,address,uint256,bytes).selector) {
        bytes params;
        safeTransferFrom@withrevert(e, from, to, tokenId, params);
    } else {
        calldataarg args;
        f@withrevert(e, args);
    }
}

function helperMintWithRevert(env e, method f, address to, uint256 tokenId) {
    if (f.selector == mint(address,uint256).selector) {
        mint@withrevert(e, to, tokenId);
    } else if (f.selector == safeMint(address,uint256).selector) {
        safeMint@withrevert(e, to, tokenId);
    } else if (f.selector == safeMint(address,uint256,bytes).selector) {
        bytes params;
        safeMint@withrevert(e, to, tokenId, params);
    } else {
        calldataarg args;
        f@withrevert(e, args);
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks: ownership count                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost tokenSupply() returns uint256 {
  init_state axiom tokenSupply() == 0;
}

ghost mapping(address => uint256) ownedByUser {
    init_state axiom forall address a. ownedByUser[a] == 0;
}

hook Sstore _owners[KEY uint256 tokenId] address newOwner (address oldOwner) STORAGE {
    havoc tokenSupply assuming
        tokenSupply@new() == tokenSupply@old() + to_uint256(newOwner != 0 ? 1 : 0) - to_uint256(oldOwner != 0 ? 1 : 0);

    ownedByUser[newOwner] = ownedByUser[newOwner] + to_uint256(newOwner != 0 ? 1 : 0);
    ownedByUser[oldOwner] = ownedByUser[oldOwner] - to_uint256(oldOwner != 0 ? 1 : 0);
}

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

ghost mapping(address => uint256) ghostBalanceOf {
    init_state axiom forall address a. ghostBalanceOf[a] == 0;
}

hook Sload uint256 value _balances[KEY address user] STORAGE {
    require ghostBalanceOf[user] == value;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: tokenSupply is the sum of all balances                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant tokenSupplyIsSumOfBalances()
    tokenSupply() == sumOfBalances()

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: balanceOf is the number of token owned                                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant balanceOfConsistency(address user)
    ownedByUser[user] == balanceOf(user) &&
    ownedByUser[user] == ghostBalanceOf[user]
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
│ Invariant: tokens that do not exist are not owned and not approved                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant notMintedUnset(uint256 tokenId)
    (!tokenExists(tokenId) <=> unsafeOwnerOf(tokenId) == 0) &&
    (!tokenExists(tokenId) => unsafeGetApproved(tokenId) == 0)

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: ownerOf and getApproved revert if token does not exist                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule notMintedRevert(uint256 tokenId) {
    bool exist = tokenExists(tokenId);

    address owner = ownerOf@withrevert(tokenId);
    assert exist <=> !lastReverted;
    assert exist => owner != 0;
    assert exist => owner == unsafeOwnerOf(tokenId);

    address approved = getApproved@withrevert(tokenId);
    assert exist <=> !lastReverted;
    assert exist => approved == unsafeGetApproved(tokenId);
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: unsafeOwnerOf and unsafeGetApproved don't revert                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule unsafeDontRevert(uint256 tokenId) {
    unsafeOwnerOf@withrevert(tokenId);
    assert !lastReverted;

    unsafeGetApproved@withrevert(tokenId);
    assert !lastReverted;
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
│ Rules: total supply can only change through mint and burn                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule tokenSupplyChange(env e) {
    method f; calldataarg args;

    uint256 tokenSupplyBefore = tokenSupply();
    f(e, args);
    uint256 tokenSupplyAfter = tokenSupply();

    assert tokenSupplyAfter > tokenSupplyBefore => (
        tokenSupplyAfter == tokenSupplyBefore + 1 &&
        (
            f.selector == mint(address,uint256).selector ||
            f.selector == safeMint(address,uint256).selector ||
            f.selector == safeMint(address,uint256,bytes).selector
        )
    );
    assert tokenSupplyAfter < tokenSupplyBefore => (
        tokenSupplyAfter == tokenSupplyBefore - 1 &&
        f.selector == burn(uint256).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: balanceOf can only change through mint, burn or transfers. balanceOf cannot change by more than 1.           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule balanceChange(env e, address account) {
    method f; uint256 tokenId;

    requireInvariant ownerHasBalance(tokenId);
    require balanceLimited(account);

    uint256 balanceBefore = balanceOf(account);
    helperTokenOperationWithRevert(e, f, tokenId);
    uint256 balanceAfter  = balanceOf(account);

    // balance can change by at most 1
    assert balanceBefore != balanceAfter => (
        balanceAfter == balanceBefore - 1 ||
        balanceAfter == balanceBefore + 1
    );

    // only selected function can change balances
    assert balanceBefore != balanceAfter => (
        f.selector == transferFrom(address,address,uint256).selector ||
        f.selector == safeTransferFrom(address,address,uint256).selector ||
        f.selector == safeTransferFrom(address,address,uint256,bytes).selector ||
        f.selector == mint(address,uint256).selector ||
        f.selector == safeMint(address,uint256).selector ||
        f.selector == safeMint(address,uint256,bytes).selector ||
        f.selector == burn(uint256).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: ownership can only change through mint, burn or transfers.                                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule ownershipChange(env e, uint256 tokenId) {
    method f; calldataarg args;

    address ownerBefore = unsafeOwnerOf(tokenId);
    f(e, args);
    address ownerAfter  = unsafeOwnerOf(tokenId);

    assert ownerBefore == 0 && ownerAfter != 0 => (
        f.selector == mint(address,uint256).selector ||
        f.selector == safeMint(address,uint256).selector ||
        f.selector == safeMint(address,uint256,bytes).selector
    );

    assert ownerBefore != 0 && ownerAfter == 0 => (
        f.selector == burn(uint256).selector
    );

    assert (ownerBefore != ownerAfter && ownerBefore != 0 && ownerAfter != 0) => (
        f.selector == transferFrom(address,address,uint256).selector ||
        f.selector == safeTransferFrom(address,address,uint256).selector ||
        f.selector == safeTransferFrom(address,address,uint256,bytes).selector
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: token approval can only change through approve or transfers (implicitelly).                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule approvalChange(env e, uint256 tokenId) {
    method f;

    address approvalBefore = unsafeGetApproved(tokenId);
    helperTokenOperationWithRevert(e, f, tokenId);
    address approvalAfter  = unsafeGetApproved(tokenId);

    assert approvalBefore != approvalAfter => (
        f.selector == approve(address,uint256).selector ||
        (
            (
                f.selector == transferFrom(address,address,uint256).selector ||
                f.selector == safeTransferFrom(address,address,uint256).selector ||
                f.selector == safeTransferFrom(address,address,uint256,bytes).selector ||
                f.selector == burn(uint256).selector
            ) && approvalAfter == 0
        )
    );
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: approval for all tokens can only change through isApprovedForAll.                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule approvedForAll(env e) {
    address owner; address spender;

    bool approvedForAllBefore = isApprovedForAll(owner, spender);
    method f; calldataarg args;
    bool approvedForAllAfter  = isApprovedForAll(owner, spender);

    assert approvedForAllBefore != approvedForAllAfter => f.selector == setApprovalForAll(address,bool).selector;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: transferFrom behavior and side effects                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transferFrom(env e, uint256 tokenId) {
    require nonpayable(e);

    address operator = e.msg.sender;
    address from;
    address to;
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
        balanceOf(from)            == balanceOfFromBefore - to_uint256(from != to ? 1 : 0) &&
        balanceOf(to)              == balanceOfToBefore   + to_uint256(from != to ? 1 : 0) &&
        unsafeOwnerOf(tokenId)     == to &&
        unsafeGetApproved(tokenId) == 0
    );

    // no side effect
    assert balanceOf(otherAccount)         != balanceOfOtherBefore => (otherAccount == from || otherAccount == to);
    assert unsafeOwnerOf(otherTokenId)     != otherOwnerBefore     => otherTokenId == tokenId;
    assert unsafeGetApproved(otherTokenId) != otherApprovalBefore  => otherTokenId == tokenId;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: transferFrom behavior and side effects                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule safeTransferFrom(env e, method f, uint256 tokenId) filtered { f ->
    f.selector == safeTransferFrom(address,address,uint256).selector ||
    f.selector == safeTransferFrom(address,address,uint256,bytes).selector
} {
    require nonpayable(e);

    address operator = e.msg.sender;
    address from;
    address to;
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

    // liveness: "safe" transfers can revert because of the receiver hook failing. Cannot prove lifeness here.
    assert success => (
        from == ownerBefore &&
        from != 0 &&
        to   != 0 &&
        (operator == from || operator == approvalBefore || isApprovedForAll(ownerBefore, operator))
    );

    // effect
    assert success => (
        balanceOf(from)            == balanceOfFromBefore - to_uint256(from != to ? 1: 0) &&
        balanceOf(to)              == balanceOfToBefore   + to_uint256(from != to ? 1: 0) &&
        unsafeOwnerOf(tokenId)     == to &&
        unsafeGetApproved(tokenId) == 0
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
rule mint(env e, uint256 tokenId) {
    require nonpayable(e);
    requireInvariant notMintedUnset(tokenId);

    address to;
    uint256 otherTokenId;
    address otherAccount;

    require balanceLimited(to);

    uint256 tokenSupplyBefore    = tokenSupply();
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
        tokenSupply()              == tokenSupplyBefore + 1 &&
        balanceOf(to)              == balanceOfToBefore + 1 &&
        unsafeOwnerOf(tokenId)     == to
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
rule safeMint(env e, method f, uint256 tokenId) filtered { f ->
    f.selector == safeMint(address,uint256).selector ||
    f.selector == safeMint(address,uint256,bytes).selector
} {
    require nonpayable(e);
    requireInvariant notMintedUnset(tokenId);

    address to;
    uint256 otherTokenId;
    address otherAccount;

    require balanceLimited(to);

    uint256 tokenSupplyBefore    = tokenSupply();
    uint256 balanceOfToBefore    = balanceOf(to);
    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
    address ownerBefore          = unsafeOwnerOf(tokenId);
    address otherOwnerBefore     = unsafeOwnerOf(otherTokenId);

    helperMintWithRevert(e, f, to, tokenId);
    bool success = !lastReverted;

    // liveness: "safe" transfers can revert because of the receiver hook failing. Cannot prove lifeness here.
    assert success => (
        ownerBefore == 0 &&
        to != 0
    );

    // effect
    assert success => (
        tokenSupply()              == tokenSupplyBefore + 1 &&
        balanceOf(to)              == balanceOfToBefore + 1 &&
        unsafeOwnerOf(tokenId)     == to
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

    uint256 tokenSupplyBefore    = tokenSupply();
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
        tokenSupply()              == tokenSupplyBefore   - 1 &&
        balanceOf(from)            == balanceOfFromBefore - 1 &&
        unsafeOwnerOf(tokenId)     == 0 &&
        unsafeGetApproved(tokenId) == 0
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
rule approve(env e, uint256 tokenId) {
    require nonpayable(e);

    address caller = e.msg.sender;
    address owner = unsafeOwnerOf(tokenId);
    address spender;
    uint256 otherTokenId;

    address otherApprovalBefore  = unsafeGetApproved(otherTokenId);

    approve@withrevert(e, spender, tokenId);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        owner != 0 &&
        owner != spender &&
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
rule setApprovalForAll(env e) {
    require nonpayable(e);

    address owner = e.msg.sender;
    address operator;
    address otherOwner;
    address otherOperator;
    bool    approved;

    bool otherIsApprovedForAllBefore = isApprovedForAll(otherOwner, otherOperator);

    setApprovalForAll@withrevert(e, operator, approved);
    bool success = !lastReverted;

    // liveness
    assert success <=> owner != operator;

    // effect
    assert success => isApprovedForAll(owner, operator) == approved;

    // no side effect
    assert isApprovedForAll(otherOwner, otherOperator) != otherIsApprovedForAllBefore => (
        otherOwner    == owner &&
        otherOperator == operator
    );
}
