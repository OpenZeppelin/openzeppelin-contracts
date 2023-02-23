// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../interfaces/IERC1363Receiver.sol";
import "../../interfaces/IERC1363Spender.sol";

contract ERC1363ReceiverMock is IERC1363Receiver, IERC1363Spender {
    event TransferReceived(address operator, address from, uint256 value, bytes data);
    event ApprovalReceived(address owner, uint256 value, bytes data);

    function onTransferReceived(
        address operator,
        address from,
        uint256 value,
        bytes memory data
    ) external override returns (bytes4) {
        if (data.length == 1) {
            if (data[0] == 0x00) return bytes4(0);
            if (data[0] == 0x01) revert("onTransferReceived revert");
            if (data[0] == 0x02) revert();
            if (data[0] == 0x03) assert(false);
        }
        emit TransferReceived(operator, from, value, data);
        return this.onTransferReceived.selector;
    }

    function onApprovalReceived(
        address owner,
        uint256 value,
        bytes memory data
    ) external override returns (bytes4) {
        if (data.length == 1) {
            if (data[0] == 0x00) return bytes4(0);
            if (data[0] == 0x01) revert("onApprovalReceived revert");
            if (data[0] == 0x02) revert();
            if (data[0] == 0x03) assert(false);
        }
        emit ApprovalReceived(owner, value, data);
        return this.onApprovalReceived.selector;
    }
}