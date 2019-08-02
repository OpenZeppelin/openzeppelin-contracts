pragma solidity ^0.5.0;

import "../gsn/GSNRecipient.sol";

contract GSNRecipientMock is GSNRecipient {
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

    function preRelayedCall(bytes calldata) external returns (bytes32) {
        // solhint-disable-previous-line no-empty-blocks
    }

    function postRelayedCall(bytes calldata, bool, uint256, bytes32) external {
        // solhint-disable-previous-line no-empty-blocks
    }

    function () external payable {
        // solhint-disable-previous-line no-empty-blocks
    }
}
