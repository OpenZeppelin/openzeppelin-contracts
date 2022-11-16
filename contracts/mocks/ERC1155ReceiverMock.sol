// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC1155/IERC1155Receiver.sol";
import "../utils/introspection/ERC165.sol";

contract ERC1155ReceiverMock is ERC165, IERC1155Receiver {
    bytes4 private _recRetval;
    uint private constant _RECREVERTS_FALSE = 1;
    uint private constant _RECREVERTS_TRUE = 2;
    uint private _recReverts;
    bytes4 private _batRetval;
    uint private constant _BATREVERTS_FALSE = 1;
    uint private constant _BATREVERTS_TRUE = 2;
    uint private _batReverts;

    event Received(address operator, address from, uint256 id, uint256 value, bytes data, uint256 gas);
    event BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data, uint256 gas);

    constructor(
        bytes4 recRetval,
        bool recReverts,
        bytes4 batRetval,
        bool batReverts
    ) {
        _recRetval = recRetval;
        _recReverts = recReverts ? _RECREVERTS_TRUE : _RECREVERTS_FALSE;
        _batRetval = batRetval;
        _batReverts = batReverts ? _BATREVERTS_TRUE: _BATREVERTS_FALSE;
    }

    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        require(_recReverts == _RECREVERTS_FALSE, "ERC1155ReceiverMock: reverting on receive");
        emit Received(operator, from, id, value, data, gasleft());
        return _recRetval;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {
        require(_batReverts == _BATREVERTS_FALSE, "ERC1155ReceiverMock: reverting on batch receive");
        emit BatchReceived(operator, from, ids, values, data, gasleft());
        return _batRetval;
    }
}
