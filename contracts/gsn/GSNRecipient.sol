pragma solidity ^0.5.0;

import "./IRelayRecipient.sol";
import "./GSNContext.sol";
import "./bouncers/GSNBouncerUtils.sol";

/*
 * @dev Base GSN recipient contract, adding the recipient interface and enabling
 * GSN support. Not all interface methods are implemented, derived contracts
 * must do so themselves.
 */
contract GSNRecipient is IRelayRecipient, GSNContext, GSNBouncerUtils {
    function getHubAddr() public view returns (address) {
        return _getRelayHub();
    }
}
