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
// Consequence of totalSupplyIsSumOfBalances
function ownerHasBalance(uint256 tokenId) returns bool {
    return unsafeOwnerOf(tokenId) != 0 => balanceOf(unsafeOwnerOf(tokenId)) > 0;
}

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
│ Ghost & hooks: sum of all balances                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost totalSupply() returns uint256 {
  init_state axiom totalSupply() == 0;
}

hook Sstore _owners[KEY uint256 tokenId] address newOwner (address oldOwner) STORAGE {
    havoc totalSupply assuming totalSupply@new() == totalSupply@old() + to_uint256(newOwner != 0 ? 1 : 0) - to_uint256(oldOwner != 0 ? 1 : 0);
}

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
│ Invariant: tokens that do not exist are not owned and not approved                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant notMintedUnset(uint256 tokenId)
    !tokenExists(tokenId) <=> unsafeOwnerOf(tokenId) == 0 &&
    !tokenExists(tokenId) => unsafeGetApproved(tokenId) == 0

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: Exist and ownership are consistent                                                                            │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule notMintedRevert(uint256 tokenId) {
    bool exist = tokenExists(tokenId);

    address owner = ownerOf@withrevert(tokenId);
    assert exist <=> !lastReverted;
    assert exist => owner != 0;

    address approved = getApproved@withrevert(tokenId);
    assert exist <=> !lastReverted;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rules: total supply can only change through mint and burn                                                           │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule totalSupplyChange(env e) {
    method f; calldataarg args;

    uint256 totalSupplyBefore = totalSupply();
    f(e, args);
    uint256 totalSupplyAfter = totalSupply();

    assert totalSupplyAfter > totalSupplyBefore => (
        totalSupplyAfter == totalSupplyBefore + 1 &&
        (
            f.selector == mint(address,uint256).selector ||
            f.selector == safeMint(address,uint256).selector ||
            f.selector == safeMint(address,uint256,bytes).selector
        )
    );
    assert totalSupplyAfter < totalSupplyBefore => (
        totalSupplyAfter == totalSupplyBefore - 1 &&
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

    require ownerHasBalance(tokenId);
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

    address approvalBefore = getApproved(tokenId);
    helperTokenOperationWithRevert(e, f, tokenId);
    address approvalAfter  = getApproved(tokenId);

    assert approvalBefore != approvalAfter => (
        f.selector == approve(address,uint256).selector ||
        (
            (
                f.selector == transferFrom(address,address,uint256).selector ||
                f.selector == safeTransferFrom(address,address,uint256).selector ||
                f.selector == safeTransferFrom(address,address,uint256,bytes).selector
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

    require ownerHasBalance(tokenId);
    require balanceLimited(to);

    uint256 balanceOfFromBefore = balanceOf(from);
    uint256 balanceOfToBefore   = balanceOf(to);
    address ownerBefore         = unsafeOwnerOf(tokenId);
    address approvalBefore      = getApproved(tokenId);

    uint256 otherTokenId;
    address otherAccount;

    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
    address otherOwnerBefore     = unsafeOwnerOf(otherTokenId);
    address otherApprovalBefore  = getApproved(otherTokenId);

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
        balanceOf(from)        == balanceOfFromBefore - to_uint256(from != to ? 1 : 0) &&
        balanceOf(to)          == balanceOfToBefore   + to_uint256(from != to ? 1 : 0) &&
        unsafeOwnerOf(tokenId) == to &&
        getApproved(tokenId)   == 0
    );

    // no side effect
    assert balanceOf(otherAccount)     != balanceOfOtherBefore => (otherAccount == from || otherAccount == to);
    assert unsafeOwnerOf(otherTokenId) != otherOwnerBefore     => otherTokenId == tokenId;
    assert getApproved(otherTokenId)   != otherApprovalBefore  => otherTokenId == tokenId;
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

    require ownerHasBalance(tokenId);
    require balanceLimited(to);

    uint256 balanceOfFromBefore = balanceOf(from);
    uint256 balanceOfToBefore   = balanceOf(to);
    address ownerBefore         = unsafeOwnerOf(tokenId);
    address approvalBefore      = unsafeGetApproved(tokenId);

    uint256 otherTokenId;
    address otherAccount;

    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
    address otherOwnerBefore     = unsafeOwnerOf(otherTokenId);
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

    require balanceLimited(to);

    uint256 balanceOfToBefore = balanceOf(to);
    address ownerBefore       = unsafeOwnerOf(tokenId);

    uint256 otherTokenId;
    address otherAccount;

    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
    address otherOwnerBefore     = unsafeOwnerOf(otherTokenId);
    address otherApprovalBefore  = unsafeGetApproved(otherTokenId);

    mint@withrevert(e, to, tokenId);
    bool success = !lastReverted;

    // liveness
    assert success <=> (
        ownerBefore == 0 &&
        to != 0
    );

    // effect
    assert success => (
        balanceOf(to)              == balanceOfToBefore + 1 &&
        unsafeOwnerOf(tokenId)     == to &&
        unsafeGetApproved(tokenId) == 0
    );

    // no side effect
    assert balanceOf(otherAccount)         != balanceOfOtherBefore => otherAccount == to;
    assert unsafeOwnerOf(otherTokenId)     != otherOwnerBefore     => otherTokenId == tokenId;
    assert unsafeGetApproved(otherTokenId) == otherApprovalBefore;
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

    require balanceLimited(to);

    uint256 balanceOfToBefore = balanceOf(to);
    address ownerBefore       = unsafeOwnerOf(tokenId);

    uint256 otherTokenId;
    address otherAccount;

    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
    address otherOwnerBefore     = unsafeOwnerOf(otherTokenId);
    address otherApprovalBefore  = unsafeGetApproved(otherTokenId);

    helperMintWithRevert(e, f, to, tokenId);
    bool success = !lastReverted;

    // liveness: "safe" transfers can revert because of the receiver hook failing. Cannot prove lifeness here.
    assert success => (
        ownerBefore == 0 &&
        to != 0
    );

    // effect
    assert success => (
        balanceOf(to)              == balanceOfToBefore + 1 &&
        unsafeOwnerOf(tokenId)     == to &&
        unsafeGetApproved(tokenId) == 0
    );

    // no side effect
    assert balanceOf(otherAccount)         != balanceOfOtherBefore => otherAccount == to;
    assert unsafeOwnerOf(otherTokenId)     != otherOwnerBefore     => otherTokenId == tokenId;
    assert unsafeGetApproved(otherTokenId) == otherApprovalBefore;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: burn behavior and side effects                                                                                │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule burn(env e, uint256 tokenId) {
    require nonpayable(e);

    address from = unsafeOwnerOf(tokenId);

    require ownerHasBalance(tokenId);

    uint256 balanceOfFromBefore = balanceOf(from);
    address ownerBefore         = unsafeOwnerOf(tokenId);

    uint256 otherTokenId;
    address otherAccount;

    uint256 balanceOfOtherBefore = balanceOf(otherAccount);
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
        balanceOf(from)            == balanceOfFromBefore - 1 &&
        unsafeOwnerOf(tokenId)     == 0 &&
        unsafeGetApproved(tokenId) == 0
    );

    // no side effect
    assert balanceOf(otherAccount)         != balanceOfOtherBefore => otherAccount == from;
    assert unsafeOwnerOf(otherTokenId)     != otherOwnerBefore     => otherTokenId == tokenId;
    assert unsafeGetApproved(otherTokenId) == otherApprovalBefore;
}










// rule approve(address,uint256)
// rule setApprovalForAll(address,bool)
