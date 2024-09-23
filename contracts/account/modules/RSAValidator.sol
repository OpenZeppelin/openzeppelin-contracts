// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC1271} from "../../interfaces/IERC1271.sol";
import {PackedUserOperation} from "../../interfaces/IERC4337.sol";
import {RSA} from "../../utils/cryptography/RSA.sol";
import {IERC7579Validator, MODULE_TYPE_VALIDATOR} from "../../interfaces/IERC7579Module.sol";
import {EIP712ReadableSigner} from "../EIP712ReadableSigner.sol";
import {ERC4337Utils} from "../utils/ERC4337Utils.sol";

abstract contract RSAValidator is IERC7579Validator, EIP712ReadableSigner {
    mapping(address => bytes) private _associatedE;
    mapping(address => bytes) private _associatedN;

    function signer(address account) public view virtual returns (bytes memory e, bytes memory n) {
        return (_associatedE[account], _associatedN[account]);
    }

    function _validateSignature(bytes32 hash, bytes calldata signature) internal view override returns (bool) {
        (bytes memory e, bytes memory n) = signer(msg.sender);
        return RSA.pkcs1(hash, signature, e, n);
    }

    function onInstall(bytes calldata data) external {
        (address account, bytes memory e, bytes memory n) = abi.decode(data, (address, bytes, bytes));
        _associatedE[account] = e;
        _associatedN[account] = n;
    }

    function onUninstall(bytes calldata data) external {
        address account = abi.decode(data, (address));
        delete _associatedE[account];
        delete _associatedN[account];
    }

    function isModuleType(uint256 moduleTypeId) external pure returns (bool) {
        return moduleTypeId == MODULE_TYPE_VALIDATOR;
    }
}
