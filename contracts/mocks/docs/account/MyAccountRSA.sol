// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {AccountRSA} from "../../../account/AccountRSA.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";

contract MyAccountRSA is AccountRSA {
    constructor(bytes memory e, bytes memory n) AccountRSA(e, n) EIP712("MyAccountRSA", "1") {}
}
