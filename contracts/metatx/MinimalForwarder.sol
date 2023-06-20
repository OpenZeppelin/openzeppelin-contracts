// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (metatx/MinimalForwarder.sol)

pragma solidity ^0.8.19;

import "../utils/cryptography/ECDSA.sol";
import "../utils/cryptography/EIP712.sol";
import "../utils/Nonces.sol";

/**
 * @dev A minimal implementation of a production-ready forwarder compatible with ERC2771 contracts.
 *
 * This forwarder operates on forward requests that include:
 *
 * * `from`: An address to operate on behalf of. It is required to be equal to the request signer.
 * * `to`: The address that should be called.
 * * `value`: The amount of ETH to attach with the requested call.
 * * `gas`: The amount of gas limit that will be forwarded with the requested call.
 * * `nonce`: A unique transaction ordering identifier to avoid replayability and request invalidation.
 * * `deadline`: A timestamp after which the request is not executable anymore.
 * * `data`: Encoded `msg.data` to send with the requested call.
 */
contract MinimalForwarder is EIP712, Nonces {
    using ECDSA for bytes32;

    struct ForwardRequest {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint256 nonce;
        uint48 deadline;
        bytes data;
    }

    bytes32 private constant _FORWARD_REQUEST_TYPEHASH =
        keccak256(
            "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint48 deadline,bytes data)"
        );

    /**
     * @dev The request `from` doesn't match with the recovered `signer`.
     */
    error MinimalForwarderInvalidSigner(address signer, address from);

    /**
     * @dev The requested `value` doesn't match with the available `msgValue`, leaving ETH stuck in the contract.
     */
    error MinimalForwarderMismatchedValue(uint256 value, uint256 msgValue);

    /**
     * @dev The list of requests length doesn't match with the list of signatures length.
     */
    error MinimalForwarderInvalidBatchLength(uint256 requestsLength, uint256 signaturesLength);

    /**
     * @dev The request `deadline` has expired.
     */
    error MinimalForwarderExpiredRequest(uint256 deadline);

    /**
     * @dev See {EIP712-constructor}.
     */
    constructor(string memory name, string memory version) EIP712(name, "1") {}

    /**
     * @dev Returns `true` if a request is valid for a provided `signature` at the current block.
     */
    function verify(ForwardRequest calldata request, bytes calldata signature) public view virtual returns (bool) {
        (bool alive, bool signerMatch, bool nonceMatch) = _validate(request, signature);
        return alive && signerMatch && nonceMatch;
    }

    /**
     * @dev Executes a `request` on behalf of `signature`'s signer guaranteeing that the forwarded call
     * will receive the requested gas and no ETH is stuck in the contract.
     */
    function execute(
        ForwardRequest calldata request,
        bytes calldata signature
    ) public payable virtual returns (bool, bytes memory) {
        (bool success, bytes memory returndata) = _execute(request, signature);

        _checkForwardedGas(gasleft(), request);

        if (msg.value != request.value) {
            revert MinimalForwarderMismatchedValue(request.value, msg.value);
        }

        return (success, returndata);
    }

    /**
     * @dev Batch version of {execute}.
     */
    function executeBatch(
        ForwardRequest[] calldata requests,
        bytes[] calldata signatures
    ) public payable virtual returns (bool[] memory, bytes[] memory) {
        if (requests.length != signatures.length) {
            revert MinimalForwarderInvalidBatchLength(requests.length, signatures.length);
        }

        uint256 requestsValue = 0;
        bool[] memory successes = new bool[](requests.length);
        bytes[] memory returndatas = new bytes[](requests.length);

        for (uint256 i; i < requests.length; ++i) {
            (bool success, bytes memory returndata) = _execute(requests[i], signatures[i]);
            requestsValue += requests[i].value;
            successes[i] = success;
            returndatas[i] = returndata;
        }

        // Only check the last request because if the batch didn't go out-of-gas at this point,
        // only the last call can be provided with less gas than requested.
        _checkForwardedGas(gasleft(), requests[requests.length - 1]);

        if (msg.value != requestsValue) {
            revert MinimalForwarderMismatchedValue(requestsValue, msg.value);
        }

        return (successes, returndatas);
    }

    /**
     * @dev Validates if the provided request can be executed at current block with `signature` on behalf of `signer`.
     */
    function _validate(
        ForwardRequest calldata request,
        bytes calldata signature
    ) internal view virtual returns (bool alive, bool signerMatch, bool nonceMatch) {
        address signer = _recoverForwardRequestSigner(request, signature);
        return (request.deadline >= block.number, signer == request.from, nonces(request.from) == request.nonce);
    }

    /**
     * @dev Recovers the signer of an EIP712 message hash for a forward `request` and its corresponding `signature`.
     * See {ECDSA-recover}.
     */
    function _recoverForwardRequestSigner(
        ForwardRequest calldata request,
        bytes calldata signature
    ) internal view returns (address) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        _FORWARD_REQUEST_TYPEHASH,
                        request.from,
                        request.to,
                        request.value,
                        request.gas,
                        request.nonce,
                        request.deadline,
                        keccak256(request.data)
                    )
                )
            ).recover(signature);
    }

    /**
     * @dev Validates and executes a signed request.
     *
     * Requirements:
     *
     * - The request's deadline must have not passed.
     * - The request's from must be the request's signer.
     * - The request's nonce must match the sender's nonce.
     *
     * IMPORTANT: Using this function does not guarantee the forwarded call will receive enough gas to complete.
     * Similarly, it doesn't check that all the `msg.value` was sent, potentially leaving ETH stuck in the contract.
     */
    function _execute(ForwardRequest calldata request, bytes calldata signature) private returns (bool, bytes memory) {
        // The _validate function is intentionally avoided to keep the signer argument and the nonce check

        if (request.deadline < block.number) {
            revert MinimalForwarderExpiredRequest(request.deadline);
        }

        address signer = _recoverForwardRequestSigner(request, signature);
        if (signer != request.from) {
            revert MinimalForwarderInvalidSigner(signer, request.from);
        }

        _useCheckedNonce(request.from, request.nonce);

        return request.to.call{gas: request.gas, value: request.value}(abi.encodePacked(request.data, request.from));
    }

    /**
     * @dev Checks if the requested gas was correctly forwarded to the callee.
     *
     * As a consequence of https://eips.ethereum.org/EIPS/eip-150[EIP-150]:
     * - At most `gasleft() - floor(gasleft() / 64)` is forwarded to the callee.
     * - At least `floor(gasleft() / 64)` is kept in the caller.
     *
     * It reverts consuming all the available gas if the forwarded gas is not the requested gas.
     */
    function _checkForwardedGas(uint256 gasLeft, ForwardRequest calldata request) private pure {
        // To avoid insufficient gas griefing attacks, as referenced in https://ronan.eth.limo/blog/ethereum-gas-dangers/
        // A malicious relayer can attempt to shrink the gas forwarded so that the underlying call reverts out-of-gas
        // and the top-level call still passes, so in order to make sure that the subcall received the requested gas,
        // we let X be the available gas before the call and require that:
        //
        // - 63/64 * X >= req.gas  // Gas before call is enough to forward req.gas to callee
        // - 63X >= 64req.gas
        // - 63(X - req.gas) >= req.gas
        // - (X - req.gas) >= req.gas/63
        //
        // Although we can't access X, we let Y be the actual gas used in the subcall so that `gasleft() == X - Y`, then
        // we know that `X - req.gas <= X - Y`, thus `req.gas <= Y` and `X - req.gas <= gasleft()`.
        // Therefore, any attempt to manipulate X to reduce the gas provided to the callee will result in the following
        // invariant violated:
        if (gasLeft < request.gas / 63) {
            // We explicitly trigger invalid opcode to consume all gas and bubble-up the effects, since
            // neither revert or assert consume all gas since Solidity 0.8.0
            // https://docs.soliditylang.org/en/v0.8.0/control-structures.html#panic-via-assert-and-error-via-require
            /// @solidity memory-safe-assembly
            assembly {
                invalid()
            }
        }
    }
}
