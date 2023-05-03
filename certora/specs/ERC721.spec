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

function helperTransferWithRevert(env e, method f, address from, address to, uint256 tokenId) {
    if (f.selector == transferFrom(address,address,uint256).selector) {
        transferFrom@withrevert(e, from, to, tokenId);
    } else if (f.selector == safeTransferFrom(address,address,uint256).selector) {
        safeTransferFrom@withrevert(e, from, to, tokenId);
    } else if (f.selector == safeTransferFrom(address,address,uint256,bytes).selector) {
        bytes params;
        require params.length < 0xffff;
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
        require params.length < 0xffff;
        safeMint@withrevert(e, to, tokenId, params);
    } else {
        require false;
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost & hooks: ownership count                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost ownedTotal() returns uint256 {
  init_state axiom ownedTotal() == 0;
}

ghost mapping(address => uint256) ownedByUser {
    init_state axiom forall address a. ownedByUser[a] == 0;
}

hook Sstore _owners[KEY uint256 tokenId] address newOwner (address oldOwner) STORAGE {
    ownedByUser[newOwner] = ownedByUser[newOwner] + to_uint256(newOwner != 0 ? 1 : 0);
    ownedByUser[oldOwner] = ownedByUser[oldOwner] - to_uint256(oldOwner != 0 ? 1 : 0);

    havoc ownedTotal assuming ownedTotal@new() == ownedTotal@old()
        + to_uint256(newOwner != 0 ? 1 : 0)
        - to_uint256(oldOwner != 0 ? 1 : 0);
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
│ Invariant: ownedTotal is the sum of all balances                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant ownedTotalIsSumOfBalances()
    ownedTotal() == sumOfBalances()

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Invariant: balanceOf is the number of tokens owned                                                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
invariant balanceOfConsistency(address user)
    balanceOf(user) == ownedByUser[user] &&
    balanceOf(user) == ghostBalanceOf[user]
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
    requireInvariant notMintedUnset(tokenId);

    bool e = tokenExists(tokenId);

    address owner = ownerOf@withrevert(tokenId);
    assert e <=> !lastReverted;
    assert e => owner == unsafeOwnerOf(tokenId); // notMintedUnset tells us this is non-zero

    address approved = getApproved@withrevert(tokenId);
    assert e <=> !lastReverted;
    assert e => approved == unsafeGetApproved(tokenId);
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
rule supplyChange(env e) {
    uint256 supplyBefore = ownedTotal();
    method f; calldataarg args; f(e, args);
    uint256 supplyAfter = ownedTotal();

    assert supplyAfter > supplyBefore => (
        supplyAfter == supplyBefore + 1 &&
        (
            f.selector == mint(address,uint256).selector ||
            f.selector == safeMint(address,uint256).selector ||
            f.selector == safeMint(address,uint256,bytes).selector
        )
    );
    assert supplyAfter < supplyBefore => (
        supplyAfter == supplyBefore - 1 &&
        f.selector == burn(uint256).selector
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

    uint256 balanceBefore = balanceOf(account);
    method f; calldataarg args; f(e, args);
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
    address ownerBefore = unsafeOwnerOf(tokenId);
    method f; calldataarg args; f(e, args);
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
│ Rules: token approval can only change through approve or transfers (implicitly).                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule approvalChange(env e, uint256 tokenId) {
    address approvalBefore = unsafeGetApproved(tokenId);
    method f; calldataarg args; f(e, args);
    address approvalAfter  = unsafeGetApproved(tokenId);

    // approve can set any value, other functions reset
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
rule approvedForAllChange(env e, address owner, address spender) {
    bool approvedForAllBefore = isApprovedForAll(owner, spender);
    method f; calldataarg args; f(e, args);
    bool approvedForAllAfter  = isApprovedForAll(owner, spender);

    assert approvedForAllBefore != approvedForAllAfter => f.selector == setApprovalForAll(address,bool).selector;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: transferFrom behavior and side effects                                                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule transferFrom(env e, address from, address to, uint256 tokenId) {
    require nonpayable(e);

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
│ Rule: safeTransferFrom behavior and side effects                                                                    │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule safeTransferFrom(env e, method f, address from, address to, uint256 tokenId) filtered { f ->
    f.selector == safeTransferFrom(address,address,uint256).selector ||
    f.selector == safeTransferFrom(address,address,uint256,bytes).selector
} {
    require nonpayable(e);

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
rule mint(env e, address to, uint256 tokenId) {
    require nonpayable(e);
    requireInvariant notMintedUnset(tokenId);

    uint256 otherTokenId;
    address otherAccount;

    require balanceLimited(to);

    uint256 supplyBefore         = ownedTotal();
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
        ownedTotal()           == supplyBefore + 1 &&
        balanceOf(to)          == balanceOfToBefore + 1 &&
        unsafeOwnerOf(tokenId) == to
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
    f.selector == safeMint(address,uint256).selector ||
    f.selector == safeMint(address,uint256,bytes).selector
} {
    require nonpayable(e);
    requireInvariant notMintedUnset(tokenId);

    uint256 otherTokenId;
    address otherAccount;

    require balanceLimited(to);

    uint256 supplyBefore         = ownedTotal();
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
        ownedTotal()           == supplyBefore + 1 &&
        balanceOf(to)          == balanceOfToBefore + 1 &&
        unsafeOwnerOf(tokenId) == to
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

    uint256 supplyBefore         = ownedTotal();
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
        ownedTotal()               == supplyBefore   - 1 &&
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
rule approve(env e, address spender, uint256 tokenId) {
    require nonpayable(e);

    address caller = e.msg.sender;
    address owner = unsafeOwnerOf(tokenId);
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
rule setApprovalForAll(env e, address operator, bool approved) {
    require nonpayable(e);

    address owner = e.msg.sender;
    address otherOwner;
    address otherOperator;

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
