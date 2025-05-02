// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {AbstractSigner} from "../../utils/cryptography/AbstractSigner.sol";
import {Account} from "../../account/Account.sol";
import {AccountERC7579} from "../../account/extensions/AccountERC7579.sol";
import {ERC721Holder} from "../../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "../../token/ERC1155/utils/ERC1155Holder.sol";
import {ERC7739} from "../../utils/cryptography/ERC7739.sol";
import {PackedUserOperation} from "../../interfaces/draft-IERC4337.sol";
import {SignerERC7702} from "../../utils/cryptography/SignerERC7702.sol";

abstract contract AccountERC7702WithModulesMock is
    Account,
    AccountERC7579,
    SignerERC7702,
    ERC7739,
    ERC721Holder,
    ERC1155Holder
{
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override(Account, AccountERC7579) returns (uint256) {
        return super._validateUserOp(userOp, userOpHash);
    }

    /// @dev Resolve implementation of ERC-1271 by both ERC7739 and AccountERC7579 to support both schemes.
    function isValidSignature(
        bytes32 hash,
        bytes calldata signature
    ) public view virtual override(ERC7739, AccountERC7579) returns (bytes4) {
        // ERC-7739 can return the fn selector (success), 0xffffffff (invalid) or 0x77390001 (detection).
        // If the return is 0xffffffff, we fallback to validation using ERC-7579 modules.
        bytes4 erc7739magic = ERC7739.isValidSignature(hash, signature);
        return erc7739magic == bytes4(0xffffffff) ? AccountERC7579.isValidSignature(hash, signature) : erc7739magic;
    }

    /// @dev Enable signature using the ERC-7702 signer.
    function _rawSignatureValidation(
        bytes32 hash,
        bytes calldata signature
    ) internal view virtual override(AbstractSigner, AccountERC7579, SignerERC7702) returns (bool) {
        return SignerERC7702._rawSignatureValidation(hash, signature);
    }
}
