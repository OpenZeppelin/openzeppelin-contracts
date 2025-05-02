// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC7579ModuleMock} from "./ERC7579ModuleMock.sol";
import {MODULE_TYPE_HOOK, IERC7579Hook} from "../../../interfaces/draft-IERC7579.sol";

abstract contract ERC7579HookMock is ERC7579ModuleMock(MODULE_TYPE_HOOK), IERC7579Hook {
    event PreCheck(address sender, uint256 value, bytes data);
    event PostCheck(bytes hookData);

    function preCheck(
        address msgSender,
        uint256 value,
        bytes calldata msgData
    ) external returns (bytes memory hookData) {
        emit PreCheck(msgSender, value, msgData);
        return msgData;
    }

    function postCheck(bytes calldata hookData) external {
        emit PostCheck(hookData);
    }
}
