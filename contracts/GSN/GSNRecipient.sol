pragma solidity ^0.5.0;

import "./IRelayRecipient.sol";
import "./GSNContext.sol";
import "./bouncers/GSNBouncerBase.sol";
import "./IRelayHub.sol";

/*
 * @dev Base GSN recipient contract, adding the recipient interface and enabling
 * GSN support. Not all interface methods are implemented, derived contracts
 * must do so themselves.
 */
contract GSNRecipient is IRelayRecipient, GSNContext, GSNBouncerBase {
    /**
     * @dev Returns the RelayHub address for this recipient contract.
     */
    function getHubAddr() public view returns (address) {
        return _relayHub;
    }

    /**
     * @dev This function returns the version string of the RelayHub for which
     * this recipient implementation was built. It's not currently used, but
     * may be used by tooling.
     */
    // This function is view for future-proofing, it may require reading from
    // storage in the future.
    function relayHubVersion() public view returns (string memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return "1.0.0";
    }

    /**
     * @dev Triggers a withdraw of the recipient's deposits in RelayHub. Can
     * be used by derived contracts to expose the functionality in an external
     * interface.
     */
    function _withdrawDeposits(uint256 amount, address payable payee) internal {
        IRelayHub(_relayHub).withdraw(amount, payee);
    }
}
