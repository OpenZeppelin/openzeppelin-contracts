// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../../interfaces/IERC4337.sol";
import {Ownable} from "../../access/Ownable.sol";
import {ERC7579Account} from "../account/ERC7579Account.sol";
import {AccountECDSA} from "../account/modules/recovery/AccountECDSA.sol";
import {AccountERC1271} from "../account/modules/recovery/AccountERC1271.sol";

contract SimpleAccountECDSA is Ownable, ERC7579Account, AccountECDSA {
    constructor(IEntryPoint entryPoint_, address owner_) ERC7579Account(entryPoint_) Ownable(owner_) {}

    function _isAuthorized(address user) internal view virtual override returns (bool) {
        return user == owner();
    }
}

contract SimpleAccountERC1271 is Ownable, ERC7579Account, AccountERC1271 {
    constructor(IEntryPoint entryPoint_, address owner_) ERC7579Account(entryPoint_) Ownable(owner_) {}

    function _isAuthorized(address user) internal view virtual override returns (bool) {
        return user == owner();
    }
}
