// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../token/ERC1155/IERC1155Receiver.sol";
import "../../utils/introspection/ERC165.sol";

contract ERC1155ReceiverMock is ERC165, IERC1155Receiver {
    enum RevertType {
        None,
        Empty,
        String,
        Custom
    }

    bytes4 private _recRetval;
    RevertType private _recReverts;
    bytes4 private _batRetval;
    RevertType private _batReverts;

    event Received(address operator, address from, uint256 id, uint256 value, bytes data, uint256 gas);
    event BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data, uint256 gas);

    error ERC1155ReceiverMockError();

    constructor(bytes4 recRetval, RevertType recReverts, bytes4 batRetval, RevertType batReverts) {
        _recRetval = recRetval;
        _recReverts = recReverts;
        _batRetval = batRetval;
        _batReverts = batReverts;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        if (_recReverts == RevertType.Empty) {
            revert();
        } else if (_recReverts == RevertType.String) {
            revert("ERC1155ReceiverMock: reverting on receive");
        } else if (_recReverts == RevertType.Custom) {
            revert ERC1155ReceiverMockError();
        }

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
        if (_batReverts == RevertType.Empty) {
            revert();
        } else if (_batReverts == RevertType.String) {
            revert("ERC1155ReceiverMock: reverting on batch receive");
        } else if (_batReverts == RevertType.Custom) {
            revert ERC1155ReceiverMockError();
        }

        emit BatchReceived(operator, from, ids, values, data, gasleft());
        return _batRetval;
    }
}
