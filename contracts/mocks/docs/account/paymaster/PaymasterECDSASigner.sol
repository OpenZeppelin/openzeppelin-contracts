// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Ownable} from "../../../../access/Ownable.sol";
import {PackedUserOperation} from "../../../../interfaces/draft-IERC4337.sol";
import {SignerECDSA} from "../../../../utils/cryptography/signers/SignerECDSA.sol";
import {PaymasterSigner, EIP712} from "../../../../account/paymaster/PaymasterSigner.sol";

contract PaymasterECDSASigner is PaymasterSigner, SignerECDSA, Ownable {
    constructor(address signerAddr) EIP712("MyPaymasterECDSASigner", "1") Ownable(signerAddr) SignerECDSA(signerAddr) {}

    function _authorizeWithdraw() internal virtual override onlyOwner {}
}
