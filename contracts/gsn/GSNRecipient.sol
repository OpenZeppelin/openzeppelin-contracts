pragma solidity ^0.5.0;

import "./IRelayRecipient.sol";
import "./IRelayHub.sol";
import "./GSNContext.sol";
import "./bouncers/GSNBouncerUtils.sol";

/*
 * @dev Base GSN recipient contract, adding the recipient interface and enabling
 * GSN support. Not all interface methods are implemented, derived contracts
 * must do so themselves.
 */
contract GSNRecipient is IRelayRecipient, GSNContext, GSNBouncerUtils {
    event GSNDepositsWithdrawn(uint256 amount, address indexed payee);

    function getHubAddr() public view returns (address) {
        return _getRelayHub();
    }

    // This function is view for future-proofing, it may require reading from
    // storage in the future.
    function relayHubVersion() public view returns (string memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return "1.0.0";
    }

    // This requires derived contracts to implement a payable fallback function
    function _withdrawDeposits(uint256 amount, address payable payee) internal {
        IRelayHub(_getRelayHub()).withdraw(amount);
        payee.transfer(amount);

        emit GSNDepositsWithdrawn(amount, payee);
    }
}
