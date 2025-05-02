// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {SignatureChecker} from "../../../utils/cryptography/SignatureChecker.sol";
import {IERC1271} from "../../../interfaces/IERC1271.sol";
import {PackedUserOperation} from "../../../interfaces/draft-IERC4337.sol";
import {IERC7579Module, IERC7579Validator, MODULE_TYPE_VALIDATOR} from "../../../interfaces/draft-IERC7579.sol";
import {ERC4337Utils} from "../../../account/utils/draft-ERC4337Utils.sol";
import {ERC7579ModuleMock} from "./ERC7579ModuleMock.sol";

abstract contract ERC7579ValidatorMock is ERC7579ModuleMock(MODULE_TYPE_VALIDATOR), IERC7579Validator {
    mapping(address sender => address signer) private _associatedSigners;

    function onInstall(bytes calldata data) public virtual override(IERC7579Module, ERC7579ModuleMock) {
        _associatedSigners[msg.sender] = address(bytes20(data[0:20]));
        super.onInstall(data);
    }

    function onUninstall(bytes calldata data) public virtual override(IERC7579Module, ERC7579ModuleMock) {
        delete _associatedSigners[msg.sender];
        super.onUninstall(data);
    }

    function validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) public view virtual returns (uint256) {
        return
            SignatureChecker.isValidSignatureNow(_associatedSigners[msg.sender], userOpHash, userOp.signature)
                ? ERC4337Utils.SIG_VALIDATION_SUCCESS
                : ERC4337Utils.SIG_VALIDATION_FAILED;
    }

    function isValidSignatureWithSender(
        address /*sender*/,
        bytes32 hash,
        bytes calldata signature
    ) public view virtual returns (bytes4) {
        return
            SignatureChecker.isValidSignatureNow(_associatedSigners[msg.sender], hash, signature)
                ? IERC1271.isValidSignature.selector
                : bytes4(0xffffffff);
    }
}
