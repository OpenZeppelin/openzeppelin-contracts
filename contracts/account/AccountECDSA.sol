// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../interfaces/IERC4337.sol";
import {Account} from "./Account.sol";
import {ECDSA} from "../utils/cryptography/ECDSA.sol";
import {Clones} from "../proxy/Clones.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";

abstract contract AccountECDSA is Account {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private immutable _signer;

    function signer() public view virtual returns (address) {
        return _signer;
    }

    function _isValidSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (address recovered, ECDSA.RecoverError err, ) = ECDSA.tryRecover(hash, signature);
        return signer() == recovered && err == ECDSA.RecoverError.NoError;
    }
}

contract AccountECDSAClonable is AccountECDSA {
    constructor(
        IEntryPoint entryPoint_,
        string memory name,
        string memory version
    ) Account(entryPoint_) EIP712(name, version) {}

    function signer() public view override returns (address) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (address));
    }
}
