// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../../interfaces/IERC4337.sol";
import {ERC721Holder} from "../../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "../../token/ERC1155/utils/ERC1155Holder.sol";
import {Address} from "../../utils/Address.sol";
import {Account} from "./Account.sol";

abstract contract AccountCommon is Account, ERC721Holder, ERC1155Holder {
    IEntryPoint private immutable _entryPoint;

    constructor(IEntryPoint entryPoint_) {
        _entryPoint = entryPoint_;
    }

    receive() external payable {}

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    function execute(address target, uint256 value, bytes calldata data) public virtual onlyEntryPoint {
        _call(target, value, data);
    }

    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) public virtual onlyEntryPoint {
        if (targets.length != calldatas.length || (values.length != 0 && values.length != targets.length)) {
            revert AccountInvalidBatchLength();
        }

        for (uint256 i = 0; i < targets.length; ++i) {
            _call(targets[i], (values.length == 0 ? 0 : values[i]), calldatas[i]);
        }
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        Address.verifyCallResult(success, returndata);
    }
}
