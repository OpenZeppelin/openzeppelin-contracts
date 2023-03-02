import "helpers.spec"
import "methods/IERC20.spec"
import "methods/IERC3156.spec"

methods {
    _mint(address account, uint256 amount) => specMint(account, amount)
    _burn(address account, uint256 amount) => specBurn(account, amount)
}

ghost mapping(address => uint256) trackedMintAmount;
ghost mapping(address => uint256) trackedBurnAmount;

function specMint(address account, uint256 amount) returns bool {
    trackedMintAmount[account] = amount;
    return true;
}

function specBurn(address account, uint256 amount) returns bool {
    trackedBurnAmount[account] = amount;
    return true;
}

rule checkMintAndBurn(env e) {
    address receiver;
    address token;
    uint256 amount;
    bytes data;

    uint256 feeBefore = flashFee(token, amount);

    flashLoan(e, receiver, token, amount, data);

    //assert to_mathint(amount)             == trackedMintAmount[receiver];
    assert to_mathint(amount + feeBefore) == trackedBurnAmount[receiver];
}
