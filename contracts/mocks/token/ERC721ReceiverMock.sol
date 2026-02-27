// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC721Receiver} from "../../token/ERC721/IERC721Receiver.sol";

contract ERC721ReceiverMock is IERC721Receiver {
    enum RevertType {
        None,
        RevertWithoutMessage,
        RevertWithMessage,
        RevertWithCustomError,
        Panic
    }

    bytes4 private immutable _retval;
    RevertType private immutable _error;

    event Received(address operator, address from, uint256 tokenId, bytes data, uint256 gas);
    error CustomError(bytes4);

    constructor(bytes4 retval, RevertType error) {
        _retval = retval;
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

    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4) {
        _handleRevert("ERC721ReceiverMock: reverting", _retval);

        emit Received(operator, from, tokenId, data, gasleft());
        return _retval;
    }
}
