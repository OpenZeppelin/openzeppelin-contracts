// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC7579Module} from "../../../interfaces/draft-IERC7579.sol";

abstract contract ERC7579ModuleMock is IERC7579Module {
    uint256 private _moduleTypeId;

    event ModuleInstalledReceived(address account, bytes data);
    event ModuleUninstalledReceived(address account, bytes data);

    constructor(uint256 moduleTypeId) {
        _moduleTypeId = moduleTypeId;
    }

    function onInstall(bytes calldata data) public virtual {
        emit ModuleInstalledReceived(msg.sender, data);
    }

    function onUninstall(bytes calldata data) public virtual {
        emit ModuleUninstalledReceived(msg.sender, data);
    }

    function isModuleType(uint256 moduleTypeId) external view returns (bool) {
        return moduleTypeId == _moduleTypeId;
    }
}
