// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC1271} from "../interfaces/IERC1271.sol";
import {Account} from "./Account.sol";
import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {SignatureChecker} from "../utils/cryptography/SignatureChecker.sol";
import {ERC4337Utils} from "./utils/ERC4337Utils.sol";

/// @dev Account compatible with an identity and support for ERC1271 signatures.
///
/// IMPORTANT: To make identities compatible with [ERC7562](https://eips.ethereum.org/EIPS/eip-7562), identity
/// contracts must not read from storage in the `isValidSignature` function. To avoid this, consider using
/// any of the available identity implementations in the `identities` directory.
abstract contract AccountIdentity is Account {
    IERC1271 private immutable _identity;

    constructor(IERC1271 id) {
        _identity = id;
    }

    function identity() public view returns (IERC1271) {
        return IERC1271(_identity);
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view override returns (address signer, uint256 validationData) {
        address id = address(_identity);
        return
            SignatureChecker.isValidSignatureNow(address(id), userOpHash, userOp.signature)
                ? (address(id), ERC4337Utils.SIG_VALIDATION_SUCCESS)
                : (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
    }
}
