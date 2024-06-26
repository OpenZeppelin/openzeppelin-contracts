// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation} from "../../../interfaces/IERC4337.sol";
import {Math} from "./../../../utils/math/Math.sol";
import {ERC4337Utils} from "./../../utils/ERC4337Utils.sol";
import {Account} from "../Account.sol";

abstract contract AccountMultisig is Account {
    function requiredSignatures() public view virtual returns (uint256);

    function _processSignature(
        bytes memory signature,
        bytes32 userOpHash
    ) internal virtual override returns (bool, address, uint48, uint48) {
        bytes[] memory signatures = abi.decode(signature, (bytes[]));

        if (signatures.length < requiredSignatures()) {
            return (false, address(0), 0, 0);
        }

        address lastSigner = address(0);
        uint48 globalValidAfter = 0;
        uint48 globalValidUntil = 0;

        for (uint256 i = 0; i < signatures.length; ++i) {
            (bool valid, address signer, uint48 validAfter, uint48 validUntil) = super._processSignature(
                signatures[i],
                userOpHash
            );
            if (valid && signer > lastSigner) {
                lastSigner = signer;
                globalValidAfter = uint48(Math.ternary(validUntil < globalValidUntil, globalValidUntil, validAfter));
                globalValidUntil = uint48(
                    Math.ternary(validUntil > globalValidUntil || validUntil == 0, globalValidUntil, validUntil)
                );
            } else {
                return (false, address(0), 0, 0);
            }
        }
        return (true, address(this), globalValidAfter, globalValidUntil);
    }
}
