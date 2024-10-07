// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {AccountBase} from "./AccountBase.sol";
import {ERC1271TypedSigner} from "../utils/cryptography/ERC1271TypedSigner.sol";
import {P256} from "../utils/cryptography/P256.sol";
import {ERC4337Utils} from "./utils/ERC4337Utils.sol";
import {ERC721Holder} from "../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155HolderLean, IERC1155Receiver} from "../token/ERC1155/utils/ERC1155HolderLean.sol";
import {ERC165} from "../utils/introspection/ERC165.sol";
import {IERC165} from "../utils/introspection/IERC165.sol";

abstract contract AccountP256 is ERC165, ERC1271TypedSigner, ERC721Holder, ERC1155HolderLean, AccountBase {
    bytes32 private immutable _qx;
    bytes32 private immutable _qy;

    constructor(bytes32 qx, bytes32 qy) {
        _qx = qx;
        _qy = qy;
    }

    function signer() public view virtual returns (bytes32 qx, bytes32 qy) {
        return (_qx, _qy);
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
        if (signature.length < 0x40) return false;
        bytes32 r = bytes32(signature[0x00:0x20]);
        bytes32 s = bytes32(signature[0x20:0x40]);
        (bytes32 qx, bytes32 qy) = signer();
        return P256.verify(hash, r, s, qx, qy);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC165, IERC165) returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId || super.supportsInterface(interfaceId);
    }
}
