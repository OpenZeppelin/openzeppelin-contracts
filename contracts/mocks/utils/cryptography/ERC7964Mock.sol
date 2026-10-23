// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {EIP712} from "../../../utils/cryptography/EIP712.sol";
import {SignatureChecker} from "../../../utils/cryptography/SignatureChecker.sol";

/**
 * @dev Application that authorizes setting a value on multiple chains with a single ERC-7964 crosschain signature.
 *
 * Signed message: `SetValue(ChainOperation[] operations,uint256 nonce)`, where each `ChainOperation` binds a value to
 * a chain and a verifying contract through a nested `EIP712ChainDomain`.
 */
contract ERC7964Mock is EIP712 {
    bytes private constant _EIP712_CHAIN_DOMAIN_TYPE = "EIP712ChainDomain(uint256 chainId,address verifyingContract)";
    bytes private constant _CHAIN_OPERATION_TYPE = "ChainOperation(EIP712ChainDomain domain,uint256 value)";
    bytes private constant _SET_VALUE_TYPE = "SetValue(ChainOperation[] operations,uint256 nonce)";

    bytes32 public constant EIP712_CHAIN_DOMAIN_TYPEHASH = keccak256(_EIP712_CHAIN_DOMAIN_TYPE);
    bytes32 public constant CHAIN_OPERATION_TYPEHASH =
        keccak256(abi.encodePacked(_CHAIN_OPERATION_TYPE, _EIP712_CHAIN_DOMAIN_TYPE));
    bytes32 public constant SET_VALUE_TYPEHASH =
        keccak256(abi.encodePacked(_SET_VALUE_TYPE, _CHAIN_OPERATION_TYPE, _EIP712_CHAIN_DOMAIN_TYPE));

    uint256 private _nonce;

    constructor(string memory name, string memory version) EIP712(name, version) {}

    function nonce() public view returns (uint256) {
        return _nonce;
    }

    function setNonce(uint256 newNonce) public {
        _nonce = newNonce;
    }

    function isValidSetValueSignature(
        address signer,
        uint256 value,
        bytes memory signature
    ) public view returns (bool) {
        return SignatureChecker.isValidCrossChainSignatureNow(signer, operationHash(value), signature, _setValueHash);
    }

    function isValidSetValueSignatureCalldata(
        address signer,
        uint256 value,
        bytes calldata signature
    ) public view returns (bool) {
        return
            SignatureChecker.isValidCrossChainSignatureNowCalldata(
                signer,
                operationHash(value),
                signature,
                _setValueHash
            );
    }

    /// @dev Struct hash of the `ChainOperation` for the current chain and contract.
    function operationHash(uint256 value) public view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    CHAIN_OPERATION_TYPEHASH,
                    keccak256(abi.encode(EIP712_CHAIN_DOMAIN_TYPEHASH, block.chainid, address(this))),
                    value
                )
            );
    }

    function _setValueHash(bytes32 operationsHash) internal view returns (bytes32) {
        return keccak256(abi.encode(SET_VALUE_TYPEHASH, operationsHash, _nonce));
    }
}
