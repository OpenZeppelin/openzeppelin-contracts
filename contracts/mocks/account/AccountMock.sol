// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Account} from "../../account/Account.sol";
import {ERC721Holder} from "../../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "../../token/ERC1155/utils/ERC1155Holder.sol";
import {ERC4337Utils} from "../../account/utils/draft-ERC4337Utils.sol";
import {ERC7739} from "../../utils/cryptography/ERC7739.sol";
import {ERC7821} from "../../account/extensions/ERC7821.sol";
import {PackedUserOperation} from "../../interfaces/draft-IERC4337.sol";

abstract contract AccountMock is Account, ERC7739, ERC7821, ERC721Holder, ERC1155Holder {
    /// Validates a user operation with a boolean signature.
    function _rawSignatureValidation(bytes32 hash, bytes calldata signature) internal pure override returns (bool) {
        return signature.length >= 32 && bytes32(signature) == hash;
    }

    /// @inheritdoc ERC7821
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 mode,
        bytes calldata executionData
    ) internal view virtual override returns (bool) {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}
