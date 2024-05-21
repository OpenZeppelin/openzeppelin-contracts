// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../../interfaces/IERC4337.sol";
import {AccessControl} from "../../access/AccessControl.sol";
import {ERC1155Holder} from "../../token/ERC1155/utils/ERC1155Holder.sol";
import {Account} from "../account/Account.sol";
import {AccountCommon} from "../account/AccountCommon.sol";
import {AccountMultisig} from "../account/modules/AccountMultisig.sol";
import {AccountECDSA} from "../account/modules/AccountECDSA.sol";
import {AccountP256} from "../account/modules/AccountP256.sol";

contract AdvancedAccountECDSA is AccessControl, AccountCommon, AccountECDSA, AccountMultisig {
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    uint256 private _requiredSignatures;

    constructor(
        IEntryPoint entryPoint_,
        address admin_,
        address[] memory signers_,
        uint256 requiredSignatures_
    ) AccountCommon(entryPoint_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        for (uint256 i = 0; i < signers_.length; ++i) {
            _grantRole(SIGNER_ROLE, signers_[i]);
        }
        _requiredSignatures = requiredSignatures_;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, ERC1155Holder) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function requiredSignatures() public view virtual override returns (uint256) {
        return _requiredSignatures;
    }

    function _isAuthorized(address user) internal view virtual override returns (bool) {
        return hasRole(SIGNER_ROLE, user);
    }

    function _processSignature(
        bytes memory signature,
        bytes32 userOpHash
    ) internal virtual override(Account, AccountMultisig) returns (bool, address, uint48, uint48) {
        return super._processSignature(signature, userOpHash);
    }
}

contract AdvancedAccountP256 is AccessControl, AccountCommon, AccountP256, AccountMultisig {
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    uint256 private _requiredSignatures;

    constructor(
        IEntryPoint entryPoint_,
        address admin_,
        address[] memory signers_,
        uint256 requiredSignatures_
    ) AccountCommon(entryPoint_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        for (uint256 i = 0; i < signers_.length; ++i) {
            _grantRole(SIGNER_ROLE, signers_[i]);
        }
        _requiredSignatures = requiredSignatures_;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, ERC1155Holder) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function requiredSignatures() public view virtual override returns (uint256) {
        return _requiredSignatures;
    }

    function _isAuthorized(address user) internal view virtual override returns (bool) {
        return hasRole(SIGNER_ROLE, user);
    }

    function _processSignature(
        bytes memory signature,
        bytes32 userOpHash
    ) internal virtual override(Account, AccountMultisig) returns (bool, address, uint48, uint48) {
        return super._processSignature(signature, userOpHash);
    }
}
