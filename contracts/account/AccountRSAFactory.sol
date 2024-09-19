// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../interfaces/IERC4337.sol";
import {AccountRSAClonable} from "./AccountRSA.sol";
import {AccountFactory} from "./AccountFactory.sol";

abstract contract AccountRSAFactory is AccountFactory {
    constructor(IEntryPoint entryPoint_, string memory name, string memory version) {
        _accountImplementation = address(new AccountRSAClonable(entryPoint_, name, version));
    }

    function clone(bytes memory e, bytes memory m, bytes32 salt) external returns (address) {
        bytes memory encodedSigner = abi.encode(e, m);
        return _clone(encodedSigner, salt);
    }
}
