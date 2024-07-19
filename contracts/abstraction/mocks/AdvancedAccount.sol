// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IEntryPoint} from "../../interfaces/IERC4337.sol";
import {AccessControl} from "../../access/AccessControl.sol";
import {Account} from "../account/Account.sol";
import {ERC7579Account} from "../account/ERC7579Account.sol";
import {AccountMultisig} from "../account/modules/AccountMultisig.sol";
import {AccountAllSignatures} from "../account/modules/recovery/AccountAllSignatures.sol";

contract AdvancedAccount is AccessControl, ERC7579Account, AccountAllSignatures, AccountMultisig {
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");
    uint256 private _requiredSignatures;

    constructor(
        IEntryPoint entryPoint_,
        address admin_,
        address[] memory signers_,
        uint256 requiredSignatures_
    ) ERC7579Account(entryPoint_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        for (uint256 i = 0; i < signers_.length; ++i) {
            _grantRole(SIGNER_ROLE, signers_[i]);
        }
        _requiredSignatures = requiredSignatures_;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC7579Account, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function requiredSignatures() public view virtual override returns (uint256) {
        return _requiredSignatures;
    }

    function _isAuthorized(address user) internal view virtual override returns (bool) {
        return hasRole(SIGNER_ROLE, user);
    }

    function _processSignature(
        bytes32 userOpHash,
        bytes calldata signature
    ) internal view virtual override(Account, AccountMultisig) returns (bool, address, uint48, uint48) {
        return super._processSignature(userOpHash, signature);
    }
}
