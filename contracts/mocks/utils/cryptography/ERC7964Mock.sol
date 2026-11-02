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
    bytes1 public constant CHAIN_FIELDS = 0x0c; // chainId and verifyingContract
    bytes32 public constant CHAIN_OPERATION_TYPEHASH =
        keccak256(abi.encodePacked(_CHAIN_OPERATION_TYPE, _EIP712_CHAIN_DOMAIN_TYPE));
    bytes32 public constant SET_VALUE_TYPEHASH =
        keccak256(abi.encodePacked(_SET_VALUE_TYPE, _CHAIN_OPERATION_TYPE, _EIP712_CHAIN_DOMAIN_TYPE));

    uint256 private _nonce;
    bytes1 private _domainFields = 0x0f;

    constructor(string memory name, string memory version) EIP712(name, version) {}

    function nonce() public view returns (uint256) {
        return _nonce;
    }

    function setNonce(uint256 newNonce) public {
        _nonce = newNonce;
    }

    function setDomainFields(bytes1 newDomainFields) public {
        _domainFields = newDomainFields;
    }

    /// @dev Returns the EIP-712 domain with the ERC-5267 `fields` set by {setDomainFields} (`0x0f` by default).
    function eip712Domain()
        public
        view
        virtual
        override
        returns (
            bytes1 fields,
            string memory name,
            string memory version,
            uint256 chainId,
            address verifyingContract,
            bytes32 salt,
            uint256[] memory extensions
        )
    {
        (, name, version, chainId, verifyingContract, salt, extensions) = super.eip712Domain();
        fields = _domainFields;
    }

    function isValidSetValueSignature(
        address signer,
        uint256 value,
        bytes memory signature
    ) public view returns (bool) {
        return
            SignatureChecker.isValidCrossChainSignatureNow(
                signer,
                operationHash(value),
                signature,
                CHAIN_FIELDS,
                _setValueHash
            );
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
                CHAIN_FIELDS,
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
