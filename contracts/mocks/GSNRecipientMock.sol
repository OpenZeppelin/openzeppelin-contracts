pragma solidity ^0.5.0;

import "./ContextMock.sol";
import "../GSN/GSNRecipient.sol";

// By inheriting from GSNRecipient, Context's internal functions are overridden automatically
contract GSNRecipientMock is ContextMock, GSNRecipient {
    function withdrawDeposits(uint256 amount, address payable payee) public {
        _withdrawDeposits(amount, payee);
    }

    function acceptRelayedCall(address, address, bytes calldata, uint256, uint256, uint256, uint256, bytes calldata, uint256)
        external
        view
        returns (uint256, bytes memory)
    {
        return (0, "");
    }

    function _preRelayedCall(bytes memory) internal returns (bytes32) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function _postRelayedCall(bytes memory, bool, uint256, bytes32) internal {
        // solhint-disable-previous-line no-empty-blocks
    }

    function upgradeRelayHub(address newRelayHub) public {
        return _upgradeRelayHub(newRelayHub);
    }
}
