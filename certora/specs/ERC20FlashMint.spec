import "helpers.spec"
import "methods/IERC20.spec"
import "methods/IERC3156.spec"

methods {
    // non standard ERC3156 functions
    flashFeeReceiver() returns (address) envfree

    // patched - function summaries below
    _mint(address account, uint256 amount) => specMint(account, amount)
    _burn(address account, uint256 amount) => specBurn(account, amount)
}

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Ghost: track mint and burns in the CVL                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
ghost mapping(address => uint256) trackedMintAmount;
ghost mapping(address => uint256) trackedBurnAmount;

function specMint(address account, uint256 amount) returns bool { trackedMintAmount[account] = amount; return true; }
function specBurn(address account, uint256 amount) returns bool { trackedBurnAmount[account] = amount; return true; }

/*
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ Rule: When doing a flashLoan, "amount" is minted and "amount + fee" is burnt                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
*/
rule checkMintAndBurn(env e) {
    address receiver;
    address token;
    uint256 amount;
    bytes data;

    uint256 feeBefore = flashFee(token, amount);
    address recipient = flashFeeReceiver();

    flashLoan(e, receiver, token, amount, data);

    assert to_mathint(amount)                                    == trackedMintAmount[receiver];
    assert to_mathint(amount + (recipient == 0 ? feeBefore : 0)) == trackedBurnAmount[receiver];
}
