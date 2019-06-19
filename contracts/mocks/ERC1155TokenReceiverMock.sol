pragma solidity ^0.5.0;

import "../token/ERC1155/IERC1155TokenReceiver.sol";
import "./ERC165Mock.sol";

contract ERC1155TokenReceiverMock is IERC1155TokenReceiver, ERC165Mock {
    bytes4 private _recRetval;
    bool private _recReverts;
    bytes4 private _batRetval;
    bool private _batReverts;

    event Received(address operator, address from, uint256 id, uint256 value, bytes data, uint256 gas);
    event BatchReceived(address operator, address from, uint256[] ids, uint256[] values, bytes data, uint256 gas);

    constructor (
        bytes4 recRetval,
        bool recReverts,
        bytes4 batRetval,
        bool batReverts,
        bytes4 isRetval,
        bool isReverts
    )
        public
    {
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
    )
        external
        returns(bytes4)
    {
        require(!_recReverts, "ERC1155TokenReceiverMock: reverting on receive");
        emit Received(operator, from, id, value, data, gasleft());
        return _recRetval;
    }

    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    )
        external
        returns(bytes4)
    {
        require(!_batReverts, "ERC1155TokenReceiverMock: reverting on batch receive");
        emit BatchReceived(operator, from, ids, values, data, gasleft());
        return _batRetval;
    }
}
