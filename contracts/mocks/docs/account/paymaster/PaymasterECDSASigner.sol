// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Ownable} from "../../../../access/Ownable.sol";
import {PackedUserOperation} from "../../../../interfaces/draft-IERC4337.sol";
import {SignerECDSA} from "../../../../utils/cryptography/signers/SignerECDSA.sol";
import {PaymasterSigner, EIP712} from "../../../../account/paymaster/extensions/PaymasterSigner.sol";

contract PaymasterECDSASigner is PaymasterSigner, SignerECDSA, Ownable {
    constructor(address signerAddr) EIP712("MyPaymasterECDSASigner", "1") Ownable(signerAddr) SignerECDSA(signerAddr) {}

    function deposit() public payable virtual {
        super._deposit();
    }

    function withdraw(address payable to, uint256 value) public virtual onlyOwner {
        super._withdraw(to, value);
    }

    function addStake(uint32 unstakeDelaySec) public payable virtual {
        super._addStake(unstakeDelaySec);
    }

    function unlockStake() public virtual onlyOwner {
        super._unlockStake();
    }

    function withdrawStake(address payable to) public virtual onlyOwner {
        super._withdrawStake(to);
    }
}
