// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../../interfaces/IERC4337.sol";
import {MessageHashUtils} from "../../../../utils/cryptography/MessageHashUtils.sol";
import {SignatureChecker} from "../../../../utils/cryptography/SignatureChecker.sol";
import {Account} from "../../Account.sol";

abstract contract AccountERC1271 is Account {
    error P256InvalidSignatureLength(uint256 length);

    function _recoverSigner(
        bytes32 userOpHash,
        bytes calldata signature
    ) internal view virtual override returns (address) {
        bytes32 msgHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        address signer = address(bytes20(signature[0x00:0x14]));

        return SignatureChecker.isValidERC1271SignatureNow(signer, msgHash, signature[0x14:]) ? signer : address(0);
    }
}
