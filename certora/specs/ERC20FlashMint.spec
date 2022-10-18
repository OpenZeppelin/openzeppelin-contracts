import "erc20methods.spec"

methods {
    maxFlashLoan(address) returns(uint256) envfree
    _burn(address account, uint256 amount) returns(bool) => specBurn(account, amount)
}

ghost mapping(address => uint256) trackedBurnAmount;

// retuns needed to overcome current CVL limitations: "could not type expression "specBurn(account,amount)", message: A summary must return a simple type, but specBurn(account,amount) returns 'void'"
function specBurn(address account, uint256 amount) returns bool {
    trackedBurnAmount[account] = amount;
    return true;
}

// Check that if flashLoan() call is successful, then proper amount of tokens was burnt(fee + flashLoan amount)
rule letsWatchItBurns(env e) {
    address receiver;
    address token;
    uint256 amount;
    bytes data;

    uint256 feeBefore = flashFee(e, token, amount);

    flashLoan(e, receiver, token, amount, data);

    uint256 burned = trackedBurnAmount[receiver];

    assert to_mathint(amount + feeBefore) == burned, "cheater";
}
