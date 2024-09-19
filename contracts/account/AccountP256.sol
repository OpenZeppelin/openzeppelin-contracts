// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../interfaces/IERC4337.sol";
import {Account} from "./Account.sol";
import {P256} from "../utils/cryptography/P256.sol";
import {Clones} from "../proxy/Clones.sol";
import {EIP712} from "../utils/cryptography/EIP712.sol";

abstract contract AccountP256 is Account {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    bytes32 private immutable _qx;
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    bytes32 private immutable _qy;

    function signer() public view virtual returns (bytes32 qx, bytes32 qy) {
        return (_qx, _qy);
    }

    function _isValidSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        if (signature.length < 0x40) return false;

        // parse signature
        bytes32 r = bytes32(signature[0x00:0x20]);
        bytes32 s = bytes32(signature[0x20:0x40]);

        // fetch and decode immutable public key for the clone
        (bytes32 qx, bytes32 qy) = signer();
        return P256.verify(hash, r, s, qx, qy);
    }
}

contract AccountP256Clonable is AccountP256 {
    constructor(
        IEntryPoint entryPoint_,
        string memory name,
        string memory version
    ) Account(entryPoint_) EIP712(name, version) {}

    function signer() public view override returns (bytes32 qx, bytes32 qy) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (bytes32, bytes32));
    }
}
