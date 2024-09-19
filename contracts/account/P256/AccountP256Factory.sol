// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../../interfaces/IERC4337.sol";
import {AccountFactory} from "./../AccountFactory.sol";
import {AccountP256Clonable} from "./AccountP256.sol";

abstract contract AccountP256Factory is AccountFactory {
    constructor(IEntryPoint entryPoint_, string memory name, string memory version) {
        _accountImplementation = address(new AccountP256Clonable(entryPoint_, name, version));
    }

    function clone(bytes32 qx, bytes32 qy, bytes32 salt) external returns (address) {
        return _clone(abi.encode(qx, qy), salt);
    }
}
