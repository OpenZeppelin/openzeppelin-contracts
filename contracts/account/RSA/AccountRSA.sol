// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../../interfaces/IERC4337.sol";
import {RSA} from "../../utils/cryptography/RSA.sol";
import {Clones} from "../../proxy/Clones.sol";
import {EIP712} from "../../utils/cryptography/EIP712.sol";
import {Account} from "./../Account.sol";

abstract contract AccountRSA is Account {
    // NOTE: There is no way to store immutable byte arrays in a contract, so we use private instead
    // This violates the ERC4337 storage access rules if this contract is used as a signer to another
    // account contract. However, when used as a clone with immutable arguments, the public key can be
    // stored as immutable.
    bytes private _e;
    bytes private _n;

    function signer() public view virtual returns (bytes memory e, bytes memory n) {
        return (_e, _n);
    }

    function _isValidSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (bytes memory e, bytes memory n) = signer();
        return RSA.pkcs1(hash, signature, e, n);
    }
}

abstract contract AccountRSAClonable is AccountRSA {
    function signer() public view override returns (bytes memory e, bytes memory m) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (bytes, bytes));
    }
}
