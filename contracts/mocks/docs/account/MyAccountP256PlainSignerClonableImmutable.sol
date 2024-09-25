// contracts/MyAccountP256PlainSignerClonableImmutable.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccountBase, PackedUserOperation} from "../../../account/AccountBase.sol";
import {P256} from "../../../utils/cryptography/P256.sol";
import {ERC4337Utils} from "../../../account/utils/ERC4337Utils.sol";
import {MessageHashUtils} from "../../../utils/cryptography/MessageHashUtils.sol";
import {Clones} from "../../../proxy/Clones.sol";

contract MyAccountP256PlainSignerClonableImmutable is AccountBase {
    function signer() public view virtual returns (bytes32 qx, bytes32 qy) {
        return abi.decode(Clones.fetchCloneArgs(address(this)), (bytes32, bytes32));
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal view override returns (address, uint256) {
        bytes32 messageHash = MessageHashUtils.toEthSignedMessageHash(
            abi.encodePacked(block.chainid, address(this), userOpHash)
        );
        // parse signature
        bytes32 r = bytes32(userOp.signature[0x00:0x20]);
        bytes32 s = bytes32(userOp.signature[0x20:0x40]);
        (bytes32 qx, bytes32 qy) = signer();
        return
            P256.verify(messageHash, r, s, qx, qy)
                ? (address(this), ERC4337Utils.SIG_VALIDATION_SUCCESS)
                : (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
    }
}

contract MyAccountP256SignerFactory {
    using Clones for address;

    // Store the implementation of the account
    address private immutable _accountImplementation = address(new MyAccountP256PlainSignerClonableImmutable());

    function predictAddress(bytes memory encodedPubKey, bytes32 salt) public view returns (address) {
        return _accountImplementation.predictDeterministicAddressWithImmutableArgs(encodedPubKey, salt, address(this));
    }

    // Create accounts on demand
    function clone(bytes memory encodedPubKey, bytes32 salt) public returns (address) {
        return _clone(encodedPubKey, salt);
    }

    function _clone(bytes memory encodedPubKey, bytes32 salt) internal returns (address) {
        address predicted = predictAddress(encodedPubKey, salt);
        if (predicted.code.length == 0) {
            assert(predicted == _accountImplementation.cloneDeterministicWithImmutableArgs(encodedPubKey, salt));
            // No initialization needed since the only args are immutable
        }
        return predicted;
    }
}
