// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1363Spender} from "../../interfaces/IERC1363Spender.sol";

contract ERC1363SpenderMock is IERC1363Spender {
    enum RevertType {
        None,
        RevertWithoutMessage,
        RevertWithMessage,
        RevertWithCustomError,
        Panic
    }

    bytes4 private immutable _retval;
    RevertType private immutable _error;

    event Approved(address owner, uint256 value, bytes data, uint256 gas);
    error CustomError(bytes4);

    constructor(bytes4 retval, RevertType error) {
        _retval = retval;
        _error = error;
    }

    function onApprovalReceived(address owner, uint256 value, bytes calldata data) public override returns (bytes4) {
        if (_error == RevertType.RevertWithoutMessage) {
            revert();
        } else if (_error == RevertType.RevertWithMessage) {
            revert("ERC1363SpenderMock: reverting");
        } else if (_error == RevertType.RevertWithCustomError) {
            revert CustomError(_retval);
        } else if (_error == RevertType.Panic) {
            uint256 a = uint256(0) / uint256(0);
            a;
        }

        emit Approved(owner, value, data, gasleft());
        return _retval;
    }
}
