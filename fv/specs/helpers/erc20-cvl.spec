// Ghost-backed model of the underlying asset token. Definitions only - no methods block.
//
// The asset has no contract in the scene, so its balances live entirely in ghost state. This
// under-approximates real tokens: no fee-on-transfer, no rebase-down, no ERC-777 reentrancy.

/// token => account => balance
ghost mapping(address => mapping(address => uint256)) balanceByToken;
/// token => owner => spender => allowance
ghost mapping(address => mapping(address => mapping(address => uint256))) allowanceByToken;

function revertOn(bool b) { if (b) { revert(); } }

/// SafeERC20 reverts on failure, so these model a revert rather than a false return.
/// require_uint256 on the credit side neglects overflow of the receiving balance; the vault's own
/// balance is bounded by the solvency invariant. Revisit if a counterexample ever turns on it.
function safeTransferCVL(address token, address from, address to, uint256 amount) {
    revertOn(balanceByToken[token][from] < amount);
    balanceByToken[token][from] = require_uint256(balanceByToken[token][from] - amount);
    balanceByToken[token][to]   = require_uint256(balanceByToken[token][to] + amount);
}

function safeTransferFromCVL(address token, address spender, address from, address to, uint256 amount) {
    revertOn(allowanceByToken[token][from][spender] < amount);
    safeTransferCVL(token, from, to, amount);
    allowanceByToken[token][from][spender] =
        require_uint256(allowanceByToken[token][from][spender] - amount);
}

function tryGetDecimalsCVL() returns (bool, uint8) {
    return (true, 18);
}

/// Exchange-rate probe. One share at 18 decimals.
definition ONE_SHARE() returns uint256 = 1000000000000000000;
