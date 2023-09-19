import "helpers/helpers.spec";
import "methods/IERC20.spec";
import "methods/IERC3156FlashLender.spec";
import "methods/IERC3156FlashBorrower.spec";

methods {
    // non standard ERC3156 functions
    function flashFeeReceiver() external returns (address) envfree;

    // function summaries below
    function _._update(address from, address to, uint256 amount) internal => specUpdate(from, to, amount) expect void ALL;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost: track mint and burns in the CVL                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost mapping(address => mathint)                     trackedMintAmount;
ghost mapping(address => mathint)                     trackedBurnAmount;
ghost mapping(address => mapping(address => mathint)) trackedTransferedAmount;

function specUpdate(address from, address to, uint256 amount) {
    if (from == 0 && to == 0) { assert(false); } // defensive

    if (from == 0) {
        trackedMintAmount[to] = amount;
    } else if (to == 0) {
        trackedBurnAmount[from] = amount;
    } else {
        trackedTransferedAmount[from][to] = amount;
    }
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: When doing a flashLoan, "amount" is minted and burnt, additionally, the fee is either burnt                   │
│ (if the fee recipient is 0) or transferred (if the fee recipient is not 0)                                          │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule checkMintAndBurn(env e) {
    address receiver;
    address token;
    uint256 amount;
    bytes data;

    uint256 fees = flashFee(token, amount);
    address recipient = flashFeeReceiver();

    flashLoan(e, receiver, token, amount, data);

    assert trackedMintAmount[receiver] == to_mathint(amount);
    assert trackedBurnAmount[receiver] == amount + to_mathint(recipient == 0 ? fees : 0);
    assert (fees > 0 && recipient != 0) => trackedTransferedAmount[receiver][recipient] == to_mathint(fees);
}
