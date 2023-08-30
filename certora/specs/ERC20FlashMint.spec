import "helpers/helpers.spec";
import "methods/IERC20.spec";
import "methods/IERC3156FlashLender.spec";
import "methods/IERC3156FlashBorrower.spec";

methods {
    // non standard ERC3156 functions
    function flashFeeReceiver() external returns (address) envfree;

    // function summaries below
    function _._mint(address account, uint256 amount)              internal => specMint(account, amount)        expect void ALL;
    function _._burn(address account, uint256 amount)              internal => specBurn(account, amount)        expect void ALL;
    function _._transfer(address from, address to, uint256 amount) internal => specTransfer(from, to, amount)   expect void ALL;
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost: track mint and burns in the CVL                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost mapping(address => mathint)                     trackedMintAmount;
ghost mapping(address => mathint)                     trackedBurnAmount;
ghost mapping(address => mapping(address => mathint)) trackedTransferedAmount;

function specMint(address account, uint256 amount)              { trackedMintAmount[account] = amount;        }
function specBurn(address account, uint256 amount)              { trackedBurnAmount[account] = amount;        }
function specTransfer(address from, address to, uint256 amount) { trackedTransferedAmount[from][to] = amount; }

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
