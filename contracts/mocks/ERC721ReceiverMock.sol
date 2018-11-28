pragma solidity ^0.4.24;

import "../token/ERC721/IERC721Receiver.sol";

contract ERC721ReceiverMock is IERC721Receiver {
    bytes4 private _retval;
    bool private _reverts;

    event Received(address operator, address from, uint256 tokenId, bytes data, uint256 gas);

    constructor (bytes4 retval, bool reverts) public {
        _retval = retval;
        _reverts = reverts;
    }

    function onERC721Received(address operator, address from, uint256 tokenId, bytes data) public returns (bytes4) {
        require(!_reverts);
        emit Received(operator, from, tokenId, data, gasleft());
        return _retval;
    }
}
