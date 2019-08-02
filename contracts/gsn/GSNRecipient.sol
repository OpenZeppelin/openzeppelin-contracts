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

    // This requires derived contracts to implement a payable fallback function
    function _withdrawDeposits(uint256 amount, address payable payee) internal {
        IRelayHub(_getRelayHub()).withdraw(amount);
        payee.transfer(amount);

        emit GSNDepositsWithdrawn(amount, payee);
    }
}
