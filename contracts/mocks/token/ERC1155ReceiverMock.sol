// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1155Receiver} from "../../token/ERC1155/IERC1155Receiver.sol";
import {ERC165} from "../../utils/introspection/ERC165.sol";

contract ERC1155ReceiverMock is ERC165, IERC1155Receiver {
    enum RevertType {
        None,
        RevertWithoutMessage,
        RevertWithMessage,
        RevertWithCustomError,
        Panic
    }

    bytes4 private immutable _recRetval;
    bytes4 private immutable _batRetval;
    RevertType private immutable _error;

    event Received(address operator, address from, uint256 id, uint256 value, bytes data, uint256 gas);
    event BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data, uint256 gas);
    error CustomError(bytes4);

    constructor(bytes4 recRetval, bytes4 batRetval, RevertType error) {
        _recRetval = recRetval;
        _batRetval = batRetval;
        _error = error;
    }

    function _handleRevert(bytes memory message, bytes4 retval) private view {
        RevertType err = _error;

        if (err == RevertType.None) return;
        if (err == RevertType.RevertWithoutMessage) revert();
        if (err == RevertType.RevertWithMessage) revert(string(message));
        if (err == RevertType.RevertWithCustomError) revert CustomError(retval);
        if (err == RevertType.Panic) {
            uint256 a = uint256(0) / uint256(0);
            a;
        }
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        _handleRevert("ERC1155ReceiverMock: reverting on receive", _recRetval);

        emit Received(operator, from, id, value, data, gasleft());
        return _recRetval;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4) {
        _handleRevert("ERC1155ReceiverMock: reverting on batch receive", _batRetval);

        emit BatchReceived(operator, from, ids, values, data, gasleft());
        return _batRetval;
    }
}
