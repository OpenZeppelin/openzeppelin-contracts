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

    bytes4 private _retval;
    RevertType private _error;

    event Approved(address owner, uint256 value, bytes data);
    error CustomError(bytes4);

    constructor() {
        _retval = IERC1363Spender.onApprovalReceived.selector;
        _error = RevertType.None;
    }

    function setUp(bytes4 retval, RevertType error) public {
        _retval = retval;
        _error = error;
    }

    function onApprovalReceived(address owner, uint256 value, bytes calldata data) external override returns (bytes4) {
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

        emit Approved(owner, value, data);
        return _retval;
    }
}
