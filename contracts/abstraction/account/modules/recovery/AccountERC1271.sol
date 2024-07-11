// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../../interfaces/IERC4337.sol";
import {MessageHashUtils} from "../../../../utils/cryptography/MessageHashUtils.sol";
import {SignatureChecker} from "../../../../utils/cryptography/SignatureChecker.sol";
import {Account} from "../../Account.sol";

abstract contract AccountERC1271 is Account {
    error P256InvalidSignatureLength(uint256 length);

    function _recoverSigner(bytes memory signature, bytes32 userOpHash) internal virtual override returns (address) {
        bytes32 msgHash = MessageHashUtils.toEthSignedMessageHash(userOpHash);
        (address signer, bytes memory sig) = abi.decode(signature, (address, bytes));

        return SignatureChecker.isValidERC1271SignatureNow(signer, msgHash, sig) ? signer : address(0);
    }
}
