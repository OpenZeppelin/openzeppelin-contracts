import "helpers/helpers.spec"
import "methods/IERC20.spec"
import "methods/IERC3156.spec"

methods {
    // non standard ERC3156 functions
    flashFeeReceiver() returns (address) envfree

    // function summaries below
    _mint(address account, uint256 amount)              => specMint(account, amount)
    _burn(address account, uint256 amount)              => specBurn(account, amount)
    _transfer(address from, address to, uint256 amount) => specTransfer(from, to, amount)
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost: track mint and burns in the CVL                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost mapping(address => uint256)                     trackedMintAmount;
ghost mapping(address => uint256)                     trackedBurnAmount;
ghost mapping(address => mapping(address => uint256)) trackedTransferedAmount;

function specMint(address account, uint256 amount)              returns bool { trackedMintAmount[account] = amount;        return true; }
function specBurn(address account, uint256 amount)              returns bool { trackedBurnAmount[account] = amount;        return true; }
function specTransfer(address from, address to, uint256 amount) returns bool { trackedTransferedAmount[from][to] = amount; return true; }

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

    assert trackedMintAmount[receiver] == amount;
    assert trackedBurnAmount[receiver] == amount + (recipient == 0 ? fees : 0);
    assert (fees > 0 && recipient != 0) => trackedTransferedAmount[receiver][recipient] == fees;
}
