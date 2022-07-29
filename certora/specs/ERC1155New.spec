import "ERC1155.spec"

//// ## Verification of ERC1155
//// 
//// `ERC1155` establishes base level support
//// [EIP1155](https://eips.ethereum.org/EIPS/eip-1155), a standard interface for
//// contracts that manage multiple token types. The contract was verified as part
//// of previous work with OpenZeppelin and is included here for the purposes of
//// increased verification coverage with respect to token transfer methods.
//// 
//// ### Assumptions and Simplifications
//// - Internal burn and mint methods are wrapped by CVT callable functions.
//// 
//// ### Properties
////
//// These properties are additions to the previous `ERC1155` verification.
//// Please see the file ERC1155.spec for earlier contract properties verified.

/// The result of transferring a single token must be equivalent whether done 
/// via safeTransferFrom or safeBatchTransferFrom.
rule singleTokenSafeTransferFromSafeBatchTransferFromEquivalence {
    storage beforeTransfer = lastStorage;
    env e;

    address holder; address recipient;
    uint256 token; uint256 transferAmount; bytes data;
    uint256[] tokens; uint256[] transferAmounts;

    mathint holderStartingBalance = balanceOf(holder, token);
    mathint recipientStartingBalance = balanceOf(recipient, token);

    require tokens.length == 1; require transferAmounts.length == 1;
    require tokens[0] == token; require transferAmounts[0] == transferAmount;

    // transferring via safeTransferFrom
    safeTransferFrom(e, holder, recipient, token, transferAmount, data) at beforeTransfer;
    mathint holderSafeTransferFromBalanceChange = holderStartingBalance - balanceOf(holder, token);
    mathint recipientSafeTransferFromBalanceChange = balanceOf(recipient, token) - recipientStartingBalance;

    // transferring via safeBatchTransferFrom
    safeBatchTransferFrom(e, holder, recipient, tokens, transferAmounts, data) at beforeTransfer;
    mathint holderSafeBatchTransferFromBalanceChange = holderStartingBalance - balanceOf(holder, token);
    mathint recipientSafeBatchTransferFromBalanceChange = balanceOf(recipient, token) - recipientStartingBalance;

    assert holderSafeTransferFromBalanceChange == holderSafeBatchTransferFromBalanceChange
        && recipientSafeTransferFromBalanceChange == recipientSafeBatchTransferFromBalanceChange, 
        "Transferring a single token via safeTransferFrom or safeBatchTransferFrom must be equivalent";
}   

/// The results of transferring multiple tokens must be equivalent whether done 
/// separately via safeTransferFrom or together via safeBatchTransferFrom.
rule multipleTokenSafeTransferFromSafeBatchTransferFromEquivalence {
    storage beforeTransfers = lastStorage;
    env e;

    address holder; address recipient; bytes data;
    uint256 tokenA; uint256 tokenB; uint256 tokenC;
    uint256 transferAmountA; uint256 transferAmountB; uint256 transferAmountC;
    uint256[] tokens; uint256[] transferAmounts;

    mathint holderStartingBalanceA = balanceOf(holder, tokenA);
    mathint holderStartingBalanceB = balanceOf(holder, tokenB);
    mathint holderStartingBalanceC = balanceOf(holder, tokenC);
    mathint recipientStartingBalanceA = balanceOf(recipient, tokenA);
    mathint recipientStartingBalanceB = balanceOf(recipient, tokenB);
    mathint recipientStartingBalanceC = balanceOf(recipient, tokenC);

    require tokens.length == 3; require transferAmounts.length == 3;
    require tokens[0] == tokenA; require transferAmounts[0] == transferAmountA;
    require tokens[1] == tokenB; require transferAmounts[1] == transferAmountB;
    require tokens[2] == tokenC; require transferAmounts[2] == transferAmountC;

    // transferring via safeTransferFrom
    safeTransferFrom(e, holder, recipient, tokenA, transferAmountA, data) at beforeTransfers;
    safeTransferFrom(e, holder, recipient, tokenB, transferAmountB, data);
    safeTransferFrom(e, holder, recipient, tokenC, transferAmountC, data);
    mathint holderSafeTransferFromBalanceChangeA = holderStartingBalanceA - balanceOf(holder, tokenA);
    mathint holderSafeTransferFromBalanceChangeB = holderStartingBalanceB - balanceOf(holder, tokenB);
    mathint holderSafeTransferFromBalanceChangeC = holderStartingBalanceC - balanceOf(holder, tokenC);
    mathint recipientSafeTransferFromBalanceChangeA = balanceOf(recipient, tokenA) - recipientStartingBalanceA;
    mathint recipientSafeTransferFromBalanceChangeB = balanceOf(recipient, tokenB) - recipientStartingBalanceB;
    mathint recipientSafeTransferFromBalanceChangeC = balanceOf(recipient, tokenC) - recipientStartingBalanceC;

    // transferring via safeBatchTransferFrom
    safeBatchTransferFrom(e, holder, recipient, tokens, transferAmounts, data) at beforeTransfers;
    mathint holderSafeBatchTransferFromBalanceChangeA = holderStartingBalanceA - balanceOf(holder, tokenA);
    mathint holderSafeBatchTransferFromBalanceChangeB = holderStartingBalanceB - balanceOf(holder, tokenB);
    mathint holderSafeBatchTransferFromBalanceChangeC = holderStartingBalanceC - balanceOf(holder, tokenC);
    mathint recipientSafeBatchTransferFromBalanceChangeA = balanceOf(recipient, tokenA) - recipientStartingBalanceA;
    mathint recipientSafeBatchTransferFromBalanceChangeB = balanceOf(recipient, tokenB) - recipientStartingBalanceB;
    mathint recipientSafeBatchTransferFromBalanceChangeC = balanceOf(recipient, tokenC) - recipientStartingBalanceC;

    assert holderSafeTransferFromBalanceChangeA == holderSafeBatchTransferFromBalanceChangeA
        && holderSafeTransferFromBalanceChangeB == holderSafeBatchTransferFromBalanceChangeB
        && holderSafeTransferFromBalanceChangeC == holderSafeBatchTransferFromBalanceChangeC
        && recipientSafeTransferFromBalanceChangeA == recipientSafeBatchTransferFromBalanceChangeA
        && recipientSafeTransferFromBalanceChangeB == recipientSafeBatchTransferFromBalanceChangeB
        && recipientSafeTransferFromBalanceChangeC == recipientSafeBatchTransferFromBalanceChangeC, 
        "Transferring multiple tokens via safeTransferFrom or safeBatchTransferFrom must be equivalent";
}

/// If transfer methods do not revert, the input arrays must be the same length.
rule transfersHaveSameLengthInputArrays {
    env e;

    address recipient; bytes data;
    uint256[] tokens; uint256[] transferAmounts;
    uint max_int = 0xffffffffffffffffffffffffffffffff;

    require tokens.length >= 0 && tokens.length <= max_int;
    require transferAmounts.length >= 0 && transferAmounts.length <= max_int;

    safeBatchTransferFrom(e, _, recipient, tokens, transferAmounts, data);

    uint256 tokensLength = tokens.length;
    uint256 transferAmountsLength = transferAmounts.length;

    assert tokens.length == transferAmounts.length, 
        "If transfer methods do not revert, the input arrays must be the same length";
}
