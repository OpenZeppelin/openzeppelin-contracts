// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {EnumerableSet} from "../utils/structs/EnumerableSet.sol";
import {Account} from "./Account.sol";
import {PackedUserOperation} from "../interfaces/IERC4337.sol";
import {SignatureChecker} from "../utils/cryptography/SignatureChecker.sol";
import {ERC4337Utils} from "./utils/ERC4337Utils.sol";
import {StorageSlot} from "../utils/StorageSlot.sol";
import {SlotDerivation} from "../utils/SlotDerivation.sol";

abstract contract AccountMultiIdentity is Account {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SlotDerivation for bytes32;
    using StorageSlot for *;

    error ERC4337InvalidIdentityThreshold();

    event ERC433ThresholdChanged(uint256 newThreshold);
    event ERC4337IdentityAdded(address indexed identity);
    event ERC4337IdentityRemoved(address indexed identity);

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.transient.AccountMultiIdentity")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 internal constant _ERC4337_ACCOUNT_MULTI_IDENTITY =
        0xbc94eb1179c3aab7e90efeb9ee7b8f65f5bf200a9f976f30f9977c3b1a495500;

    EnumerableSet.AddressSet private _identities;
    uint256 private _threshold;

    constructor(address[] memory identities, uint256 initialThreshold) {
        if (initialThreshold <= 0 || initialThreshold > identities.length) {
            revert ERC4337InvalidIdentityThreshold();
        }
        for (uint256 i = 0; i < identities.length; i++) {
            _identities.add(identities[i]);
        }
        _threshold = initialThreshold;
    }

    function threshold() public view returns (uint256) {
        return _threshold;
    }

    function addIdentity(address identity) public {
        _identities.add(identity);
        emit ERC4337IdentityAdded(identity);
    }

    function removeIdentity(address identity) public {
        _identities.remove(identity);
        emit ERC4337IdentityRemoved(identity);
    }

    function isIdentity(address identity) public view returns (bool) {
        return _identities.contains(identity);
    }

    function updateThreshold(uint256 newThreshold) public {
        if (newThreshold <= 0 || newThreshold > _identities.length()) {
            revert ERC4337InvalidIdentityThreshold();
        }
        _threshold = newThreshold;
        emit ERC433ThresholdChanged(newThreshold);
    }

    function _validateUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal override returns (address signer, uint256 validationData) {
        uint256 validSignatures = 0;
        uint256 identitiesLength = _identities.length();

        for (uint256 i = 0; i < identitiesLength; i++) {
            address identity = _identities.at(i);
            StorageSlot.BooleanSlotType usedSlot = _ERC4337_ACCOUNT_MULTI_IDENTITY.deriveMapping(identity).asBoolean();
            if (!usedSlot.tload() && SignatureChecker.isValidSignatureNow(signer, userOpHash, userOp.signature)) {
                validSignatures++;
                usedSlot.tstore(true);
            }
        }

        return
            validSignatures >= threshold()
                ? (address(this), ERC4337Utils.SIG_VALIDATION_SUCCESS)
                : (address(0), ERC4337Utils.SIG_VALIDATION_FAILED);
    }
}
