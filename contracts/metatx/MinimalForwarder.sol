// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (metatx/MinimalForwarder.sol)

pragma solidity ^0.8.19;

import "../utils/cryptography/ECDSA.sol";
import "../utils/cryptography/EIP712.sol";

/**
 * @dev Simple minimal forwarder to be used together with an ERC2771 compatible contract. See {ERC2771Context}.
 *
 * MinimalForwarder is mainly meant for testing, as it is missing features to be a good production-ready forwarder. This
 * contract does not intend to have all the properties that are needed for a sound forwarding system. A fully
 * functioning forwarding system with good properties requires more complexity. We suggest you look at other projects
 * such as the GSN which do have the goal of building a system like that.
 */
contract MinimalForwarder is EIP712 {
    using ECDSA for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        bytes data;
    }

    bytes32 private constant _TYPEHASH =
        keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data)");

    mapping(address => uint256) private _nonces;

    /**
     * @dev The request `from` doesn't match with the recovered `signer`.
     */
    error MinimalForwarderInvalidSigner(address signer, address from);

    /**
     * @dev The request nonce doesn't match with the `current` nonce for the request signer.
     */
    error MinimalForwarderInvalidNonce(address signer, uint256 current);

    constructor() EIP712("MinimalForwarder", "0.0.1") {}

    function getNonce(address from) public view returns (uint256) {
        return _nonces[from];
    }

    function verify(ForwardRequest calldata req, bytes calldata signature) public view returns (bool) {
        address signer = _recover(req, signature);
        (bool correctFrom, bool correctNonce) = _validateReq(req, signer);
        return correctFrom && correctNonce;
    }

    function execute(
        ForwardRequest calldata req,
        bytes calldata signature
    ) public payable returns (bool, bytes memory) {
        address signer = _recover(req, signature);
        (bool correctFrom, bool correctNonce) = _validateReq(req, signer);

        if (!correctFrom) {
            revert MinimalForwarderInvalidSigner(signer, req.from);
        }
        if (!correctNonce) {
            revert MinimalForwarderInvalidNonce(signer, _nonces[req.from]);
        }

        _nonces[req.from] = req.nonce + 1;

        (bool success, bytes memory returndata) = req.to.call{gas: req.gas, value: req.value}(
            abi.encodePacked(req.data, req.from)
        );

        // Validate that the relayer has sent enough gas for the call.
        // See https://ronan.eth.limo/blog/ethereum-gas-dangers/
        if (gasleft() <= req.gas / 63) {
            // We explicitly trigger invalid opcode to consume all gas and bubble-up the effects, since
            // neither revert or assert consume all gas since Solidity 0.8.0
            // https://docs.soliditylang.org/en/v0.8.0/control-structures.html#panic-via-assert-and-error-via-require
            /// @solidity memory-safe-assembly
            assembly {
                invalid()
            }
        }

        return (success, returndata);
    }

    function _recover(ForwardRequest calldata req, bytes calldata signature) internal view returns (address) {
        return
            _hashTypedDataV4(
                keccak256(abi.encode(_TYPEHASH, req.from, req.to, req.value, req.gas, req.nonce, keccak256(req.data)))
            ).recover(signature);
    }

    function _validateReq(
        ForwardRequest calldata req,
        address signer
    ) internal view returns (bool correctFrom, bool correctNonce) {
        return (signer == req.from, _nonces[req.from] == req.nonce);
    }
}
