// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccountECDSA} from "../../../account/AccountECDSA.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";

contract MyAccountECDSA is AccountECDSA {
    constructor(address owner) AccountECDSA(owner) EIP712("MyAccountECDSA", "1") {}
}
