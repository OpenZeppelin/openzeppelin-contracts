// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {SignatureValidator} from "../../../account/modules/SignatureValidator.sol";

contract SignatureValidatorMock is SignatureValidator {
    function _validateSignatureWithSender(
        address /* sender */,
        bytes32 /* envelopeHash */,
        bytes calldata signature
    ) internal pure override returns (bool) {
        return bytes1(signature[0:1]) == bytes1(0x01);
    }

    function onInstall(bytes memory data) public virtual {
        // do nothing
    }

    function onUninstall(bytes memory data) public virtual {
        // do nothing
    }
}
