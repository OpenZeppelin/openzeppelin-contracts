// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Account} from "../../Account.sol";
import {ECDSA} from "../../../../utils/cryptography/ECDSA.sol";
import {ERC4337Utils} from "./../../../utils/ERC4337Utils.sol";
import {MessageHashUtils} from "../../../../utils/cryptography/MessageHashUtils.sol";
import {PackedUserOperation} from "../../../../interfaces/IERC4337.sol";
import {IERC7579Validator} from "../../../../interfaces/IERC7579Module.sol";

abstract contract AccountValidateERC7579 is Account {
    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        bytes calldata userOpSignature
    ) internal virtual override returns (address, uint256) {
        // prepare userOp with cherrypicked signature
        PackedUserOperation memory userOpCopy = userOp;
        userOpCopy.signature = userOpSignature[0x14:];
        // do check
        address module = address(bytes20(userOpSignature[0x00:0x14]));
        uint256 validationData = IERC7579Validator(module).validateUserOp(userOpCopy, userOpHash);
        return (module, validationData);
    }
}
