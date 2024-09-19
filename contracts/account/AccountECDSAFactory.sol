// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../interfaces/IERC4337.sol";
import {AccountECDSAClonable} from "./AccountECDSA.sol";
import {AccountFactory} from "./AccountFactory.sol";

abstract contract AccountECDSAFactory is AccountFactory {
    constructor(IEntryPoint entryPoint_, string memory name, string memory version) {
        _accountImplementation = address(new AccountECDSAClonable(entryPoint_, name, version));
    }

    function clone(address signer, bytes32 salt) external returns (address) {
        bytes memory encodedSigner = abi.encode(signer);
        return _clone(encodedSigner, salt);
    }
}
