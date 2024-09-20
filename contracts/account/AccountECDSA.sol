// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ECDSA} from "../utils/cryptography/ECDSA.sol";
import {Clones} from "../proxy/Clones.sol";
import {Account} from "./Account.sol";

abstract contract AccountECDSA is Account {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private immutable _signer;

    function signer() public view virtual returns (address) {
        return _signer;
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return signer() == recovered && err == ECDSA.RecoverError.NoError;
    }
}

abstract contract AccountECDSAClonable is AccountECDSA {
    function signer() public view override returns (address) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (address));
    }
}
