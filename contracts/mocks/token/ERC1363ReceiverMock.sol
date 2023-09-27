// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import {IERC1363Receiver} from "../../interfaces/IERC1363Receiver.sol";

contract ERC1363ReceiverMock is IERC1363Receiver {
    enum RevertType {
        None,
        RevertWithoutMessage,
        RevertWithMessage,
        RevertWithCustomError,
        Panic
    }

    bytes4 private immutable _retval;
    RevertType private immutable _error;

    event Received(address operator, address from, uint256 value, bytes data, uint256 gas);
    error CustomError(bytes4);

    constructor(bytes4 retval, RevertType error) {
        _retval = retval;
        _error = error;
    }

    function onTransferReceived(
        address operator,
        address from,
        uint256 value,
        bytes calldata data
    ) public override returns (bytes4) {
        if (_error == RevertType.RevertWithoutMessage) {
            revert();
        } else if (_error == RevertType.RevertWithMessage) {
            revert("ERC1363ReceiverMock: reverting");
        } else if (_error == RevertType.RevertWithCustomError) {
            revert CustomError(_retval);
        } else if (_error == RevertType.Panic) {
            uint256 a = uint256(0) / uint256(0);
            a;
        }

        emit Received(operator, from, value, data, gasleft());
        return _retval;
    }
}
