// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccountP256} from "../../../account/AccountP256.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";

contract MyAccountP256 is AccountP256 {
    constructor(bytes32 qx, bytes32 qy) AccountP256(qx, qy) EIP712("MyAccountP256", "1") {}
}
