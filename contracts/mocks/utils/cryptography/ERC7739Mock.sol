// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ECDSA} from "../../../utils/cryptography/ECDSA.sol";
import {ERC7739} from "../../../utils/cryptography/signers/draft-ERC7739.sol";
import {SignerECDSA} from "../../../utils/cryptography/signers/SignerECDSA.sol";
import {SignerP256} from "../../../utils/cryptography/signers/SignerP256.sol";
import {SignerRSA} from "../../../utils/cryptography/signers/SignerRSA.sol";

abstract contract ERC7739ECDSAMock is ERC7739, SignerECDSA {}
abstract contract ERC7739P256Mock is ERC7739, SignerP256 {}
abstract contract ERC7739RSAMock is ERC7739, SignerRSA {}
