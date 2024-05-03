// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {PackedUserOperation, IEntryPoint} from "../../interfaces/IERC4337.sol";
import {AccessControl} from "../../access/AccessControl.sol";
import {ERC721Holder} from "../../token/ERC721/utils/ERC721Holder.sol";
import {ERC1155Holder} from "../../token/ERC1155/utils/ERC1155Holder.sol";
import {Address} from "../../utils/Address.sol";
import {Account} from "../account/Account.sol";
import {AccountMultisig} from "../account/modules/AccountMultisig.sol";
import {AccountECDSA} from "../account/modules/AccountECDSA.sol";
import {AccountP256} from "../account/modules/AccountP256.sol";

abstract contract AdvancedAccount is AccountMultisig, AccessControl, ERC721Holder, ERC1155Holder {
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    IEntryPoint private immutable _entryPoint;
    uint256 private _requiredSignatures;

    constructor(IEntryPoint entryPoint_, address admin_, address[] memory signers_, uint256 requiredSignatures_) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        for (uint256 i = 0; i < signers_.length; ++i) {
            _grantRole(SIGNER_ROLE, signers_[i]);
        }

        _entryPoint = entryPoint_;
        _requiredSignatures = requiredSignatures_;
    }

    receive() external payable {}

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, ERC1155Holder) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    function requiredSignatures(
        PackedUserOperation calldata /*userOp*/
    ) public view virtual override returns (uint256) {
        return _requiredSignatures;
    }

    function _isAuthorized(address user) internal view virtual override returns (bool) {
        return hasRole(SIGNER_ROLE, user);
    }

    function execute(address target, uint256 value, bytes calldata data) public virtual onlyEntryPoint {
        _call(target, value, data);
    }

    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata calldatas
    ) public virtual onlyEntryPoint {
        if (targets.length != calldatas.length || (values.length != 0 && values.length != targets.length)) {
            revert AccountInvalidBatchLength();
        }

        for (uint256 i = 0; i < targets.length; ++i) {
            _call(targets[i], (values.length == 0 ? 0 : values[i]), calldatas[i]);
        }
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        Address.verifyCallResult(success, returndata);
    }
}

contract AdvancedAccountECDSA is AdvancedAccount, AccountECDSA {
    constructor(
        IEntryPoint entryPoint_,
        address admin_,
        address[] memory signers_,
        uint256 requiredSignatures_
    ) AdvancedAccount(entryPoint_, admin_, signers_, requiredSignatures_) {}

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override(Account, AccountMultisig) returns (uint256 validationData) {
        // In this mock, calling super would work, but it may not depending on how the function is overriden by other
        // modules. Using a more explicit override may bypass additional modules though.
        //
        // If possible, this should be improved.
        return AccountMultisig._validateSignature(userOp, userOpHash);
    }
}

contract AdvancedAccountP256 is AdvancedAccount, AccountP256 {
    constructor(
        IEntryPoint entryPoint_,
        address admin_,
        address[] memory signers_,
        uint256 requiredSignatures_
    ) AdvancedAccount(entryPoint_, admin_, signers_, requiredSignatures_) {}

    function _validateSignature(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override(Account, AccountMultisig) returns (uint256 validationData) {
        // In this mock, calling super would work, but it may not depending on how the function is overriden by other
        // modules. Using a more explicit override may bypass additional modules though.
        //
        // If possible, this should be improved.
        return AccountMultisig._validateSignature(userOp, userOpHash);
    }
}
