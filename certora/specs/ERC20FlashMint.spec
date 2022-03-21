import "erc20.spec"

methods {
    onFlashLoan(address, address, uint256, uint256, bytes) => HAVOC_ALL // HAVOC_ECF

    _burn(address account, uint256 amount) returns(bool) => specBurn(account, amount);
}

ghost mapping(address => uint256) trackedBurnAmount;

function specBurn(address account, uint256 amount) returns bool {   // retuns needed to overcome current CVL limitations: "could not type expression "specBurn(account,amount)", message: A summary must return a simple type, but specBurn(account,amount) returns 'void'"
    trackedBurnAmount[account] = amount;
    return true;
}

// ghost to save args that were passed to burn function
// summarize burn
// assert ghost == amount + fee


// STATUS - in progress
// HAVOC_ALL - everything is havoced => violation
// HAVOC_ECF - verified
// https://vaas-stg.certora.com/output/3106/8795450b626f2ca53a2b/?anonymousKey=dd774da10cc595e4e38357af9e4f50bf2c0cb02a
// fee + flashLoan amount is burned
rule letsWatchItBurns(env e){
    address receiver; address token; uint256 amount; bytes data;
    require amount > 0;

    uint256 feeBefore = flashFee(e, token, amount);

    flashLoan(e, receiver, token, amount, data);

    uint256 burned = trackedBurnAmount[receiver];

    assert to_mathint(amount + feeBefore) == burned, "cheater";
}