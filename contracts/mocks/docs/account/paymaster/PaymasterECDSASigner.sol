// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Ownable} from "../../../../access/Ownable.sol";
import {SignerECDSA} from "../../../../utils/cryptography/signers/SignerECDSA.sol";
import {PaymasterSigner, EIP712} from "../../../../account/paymaster/extensions/PaymasterSigner.sol";

contract PaymasterECDSASigner is PaymasterSigner, SignerECDSA, Ownable {
    constructor(address signerAddr) EIP712("MyPaymasterECDSASigner", "1") Ownable(signerAddr) SignerECDSA(signerAddr) {}

    function deposit() public payable virtual {
        _deposit();
    }

    function withdraw(address payable to, uint256 value) public virtual onlyOwner {
        _withdraw(to, value);
    }

    function addStake(uint32 unstakeDelaySec) public payable virtual {
        _addStake(unstakeDelaySec);
    }

    function unlockStake() public virtual onlyOwner {
        _unlockStake();
    }

    function withdrawStake(address payable to) public virtual onlyOwner {
        _withdrawStake(to);
    }
}
