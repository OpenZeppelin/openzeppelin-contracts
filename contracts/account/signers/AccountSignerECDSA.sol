// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ECDSA} from "../../utils/cryptography/ECDSA.sol";
import {Clones} from "../../proxy/Clones.sol";
import {AccountSigner} from "./AccountSigner.sol";
import {EIP712} from "../../utils/cryptography/EIP712.sol";

abstract contract AccountSignerECDSA is AccountSigner {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private immutable _signer;

    constructor(address signerAddr, string memory name, string memory version) EIP712(name, version) {
        _signer = signerAddr;
    }

    function signer() public view virtual returns (address) {
        return _signer;
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return signer() == recovered && err == ECDSA.RecoverError.NoError;
    }
}

abstract contract AccountSignerECDSAClonable is AccountSignerECDSA {
    function signer() public view override returns (address) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (address));
    }
}
