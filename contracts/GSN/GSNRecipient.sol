pragma solidity ^0.5.0;

import "./IRelayRecipient.sol";
import "./GSNContext.sol";
import "./bouncers/GSNBouncerBase.sol";
import "./IRelayHub.sol";

/**
 * @dev Base GSN recipient contract: includes the {IRelayRecipient} interface and enables GSN support on all contracts
 * in the inheritance tree.
 *
 * Not all interface methods are implemented (e.g. {acceptRelayedCall}, derived contracts must provide one themselves.
 */
contract GSNRecipient is IRelayRecipient, GSNContext, GSNBouncerBase {
    /**
     * @dev Returns the `RelayHub` address for this recipient contract.
     */
    function getHubAddr() public view returns (address) {
        return _relayHub;
    }

    /**
     * @dev Returns the version string of the `RelayHub` for which this recipient implementation was built.
     */
    // This function is view for future-proofing, it may require reading from
    // storage in the future.
    function relayHubVersion() public view returns (string memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return "1.0.0";
    }

    /**
     * @dev Withdraws the recipient's deposits in `RelayHub`.
     *
     * Derived contracts should expose this in an external interface with proper access control.
     */
    function _withdrawDeposits(uint256 amount, address payable payee) internal {
        IRelayHub(_relayHub).withdraw(amount, payee);
    }
}
