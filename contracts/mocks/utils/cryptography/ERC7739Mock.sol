// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ECDSA} from "../../../utils/cryptography/ECDSA.sol";
import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {ERC7739} from "../../../utils/cryptography/signers/draft-ERC7739.sol";
import {SignerECDSA} from "../../../utils/cryptography/signers/SignerECDSA.sol";
import {SignerP256} from "../../../utils/cryptography/signers/SignerP256.sol";
import {SignerRSA} from "../../../utils/cryptography/signers/SignerRSA.sol";

contract ERC7739ECDSAMock is ERC7739, SignerECDSA {
    constructor(address signerAddr) EIP712("ERC7739ECDSA", "1") {
        _setSigner(signerAddr);
    }
}

contract ERC7739P256Mock is ERC7739, SignerP256 {
    constructor(bytes32 qx, bytes32 qy) EIP712("ERC7739P256", "1") {
        _setSigner(qx, qy);
    }
}

contract ERC7739RSAMock is ERC7739, SignerRSA {
    constructor(bytes memory e, bytes memory n) EIP712("ERC7739RSA", "1") {
        _setSigner(e, n);
    }
}
