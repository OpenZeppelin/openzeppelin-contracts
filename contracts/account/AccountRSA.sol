// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {AccountBase} from "./AccountBase.sol";
import {ERC1271TypedSigner} from "../utils/cryptography/ERC1271TypedSigner.sol";
import {RSA} from "../utils/cryptography/RSA.sol";
import {ERC4337Utils} from "./utils/ERC4337Utils.sol";

// NOTE: Storing `_e` and `_e` in regular violate ERC-7562 validation rules.
// Consider deploying this contract through a factory that sets `_e` and `_n`
// as immutable arguments (see {Clones-cloneDeterministicWithImmutableArgs}).
abstract contract AccountRSA is ERC1271TypedSigner, AccountBase {
    bytes private _e;
    bytes private _n;

    constructor(bytes memory e, bytes memory n) {
        _e = e;
        _n = n;
    }

    function signer() public view virtual returns (bytes memory e, bytes memory n) {
        return (_e, _n);
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256) {
        return
            _isValidSignature(userOpHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view virtual override returns (bool) {
        (bytes memory e, bytes memory n) = signer();
        return RSA.pkcs1(hash, signature, e, n);
    }
}
