// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AccountERC7702WithModulesMock} from "../patched/mocks/account/AccountMock.sol";
import {EIP712} from "../patched/utils/cryptography/EIP712.sol";

contract AccountHarness is AccountERC7702WithModulesMock {
    constructor(string memory name, string memory version) EIP712(name, version) {}

    function getFallbackHandler(uint32 selector) external view returns (address) {
        return _fallbackHandler(bytes4(selector));
    }
}
