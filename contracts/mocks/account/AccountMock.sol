// SPDX-License-Identifier: MIT

pragma solidity ^0.8.27;

import {Account} from "../../account/Account.sol";
import {AccountERC7579} from "../../account/extensions/draft-AccountERC7579.sol";
import {AccountERC7579Hooked} from "../../account/extensions/draft-AccountERC7579Hooked.sol";
import {ERC721Holder} from "../../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "../../token/ERC1155/utils/ERC1155Holder.sol";
import {ERC4337Utils} from "../../account/utils/draft-ERC4337Utils.sol";
import {ERC7739} from "../../utils/cryptography/signers/draft-ERC7739.sol";
import {ERC7821} from "../../account/extensions/draft-ERC7821.sol";
import {MODULE_TYPE_VALIDATOR} from "../../interfaces/draft-IERC7579.sol";
import {PackedUserOperation} from "../../interfaces/draft-IERC4337.sol";
import {AbstractSigner} from "../../utils/cryptography/signers/AbstractSigner.sol";
import {SignerECDSA} from "../../utils/cryptography/signers/SignerECDSA.sol";
import {SignerP256} from "../../utils/cryptography/signers/SignerP256.sol";
import {SignerRSA} from "../../utils/cryptography/signers/SignerRSA.sol";
import {SignerERC7702} from "../../utils/cryptography/signers/SignerERC7702.sol";
import {SignerERC7913} from "../../utils/cryptography/signers/SignerERC7913.sol";
import {MultiSignerERC7913} from "../../utils/cryptography/signers/MultiSignerERC7913.sol";
import {MultiSignerERC7913Weighted} from "../../utils/cryptography/signers/MultiSignerERC7913Weighted.sol";

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

abstract contract AccountECDSAMock is Account, SignerECDSA, ERC7739, ERC7821, ERC721Holder, ERC1155Holder {
    /// @inheritdoc ERC7821
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 mode,
        bytes calldata executionData
    ) internal view virtual override returns (bool) {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}

abstract contract AccountP256Mock is Account, SignerP256, ERC7739, ERC7821, ERC721Holder, ERC1155Holder {
    /// @inheritdoc ERC7821
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 mode,
        bytes calldata executionData
    ) internal view virtual override returns (bool) {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}

abstract contract AccountRSAMock is Account, SignerRSA, ERC7739, ERC7821, ERC721Holder, ERC1155Holder {
    /// @inheritdoc ERC7821
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 mode,
        bytes calldata executionData
    ) internal view virtual override returns (bool) {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}

abstract contract AccountERC7702Mock is Account, SignerERC7702, ERC7739, ERC7821, ERC721Holder, ERC1155Holder {
    /// @inheritdoc ERC7821
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 mode,
        bytes calldata executionData
    ) internal view virtual override returns (bool) {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}

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

abstract contract AccountERC7579Mock is AccountERC7579 {
    constructor(address validator, bytes memory initData) {
        _installModule(MODULE_TYPE_VALIDATOR, validator, initData);
    }
}

abstract contract AccountERC7579HookedMock is AccountERC7579Hooked {
    constructor(address validator, bytes memory initData) {
        _installModule(MODULE_TYPE_VALIDATOR, validator, initData);
    }
}

abstract contract AccountERC7913Mock is Account, SignerERC7913, ERC7739, ERC7821, ERC721Holder, ERC1155Holder {
    /// @inheritdoc ERC7821
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 mode,
        bytes calldata executionData
    ) internal view virtual override returns (bool) {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}

abstract contract AccountMultiSignerMock is Account, MultiSignerERC7913, ERC7739, ERC7821, ERC721Holder, ERC1155Holder {
    /// @inheritdoc ERC7821
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 mode,
        bytes calldata executionData
    ) internal view virtual override returns (bool) {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}

abstract contract AccountMultiSignerWeightedMock is
    Account,
    MultiSignerERC7913Weighted,
    ERC7739,
    ERC7821,
    ERC721Holder,
    ERC1155Holder
{
    /// @inheritdoc ERC7821
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 mode,
        bytes calldata executionData
    ) internal view virtual override returns (bool) {
        return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
    }
}
