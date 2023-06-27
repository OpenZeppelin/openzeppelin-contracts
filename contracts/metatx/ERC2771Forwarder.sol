// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (metatx/ERC2771Forwarder.sol)

pragma solidity ^0.8.19;

import "../utils/cryptography/ECDSA.sol";
import "../utils/cryptography/EIP712.sol";
import "../utils/Nonces.sol";
import "../utils/Address.sol";

/**
 * @dev An implementation of a production-ready forwarder compatible with ERC2771 contracts.
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
contract ERC2771Forwarder is EIP712, Nonces {
    using ECDSA for bytes32;

    struct ForwardRequestData {
        address from;
        address to;
        uint256 value;
        uint256 gas;
        uint48 deadline;
        bytes data;
        bytes signature;
    }

    bytes32 private constant _FORWARD_REQUEST_TYPEHASH =
        keccak256(
            "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint48 deadline,bytes data)"
        );

    /**
     * @dev Emitted when a `ForwardRequest` is executed.
     *
     * NOTE: A non sucessful forwarded request should not be assumed as non out of gas exception because of
     * {_checkForwardedGas}. Such function doesn't guarantee an out of gas exception won't be thrown, but instead
     * it guarantees a relayer provided enough gas to cover the signer requested gas.
     */
    event ExecutedForwardRequest(address indexed signer, uint256 nonce, bool success);

    /**
     * @dev The request `from` doesn't match with the recovered `signer`.
     */
    error ERC2771ForwarderInvalidSigner(address signer, address from);

    /**
     * @dev The requested `value` doesn't match with the available `msgValue`.
     */
    error ERC2771ForwarderMismatchedValue(uint256 value, uint256 msgValue);

    /**
     * @dev The request `deadline` has expired.
     */
    error ERC2771ForwarderExpiredRequest(uint48 deadline);

    /**
     * @dev See {EIP712-constructor}.
     */
    constructor(string memory name) EIP712(name, "1") {}

    /**
     * @dev Returns `true` if a request is valid for a provided `signature` at the current block.
     *
     * A transaction is considered valid when it hasn't expired (deadline is not met), and the signer
     * matches the `from` parameter of the signed request.
     *
     * NOTE: A request may return false here but it optionally reverts in {batchExecute} to prevent
     * reverts when a batch includes a request that was already frontrunned by another relay. This
     * behavior is opt-in by using a flag in {executeBatch}.
     */
    function verify(ForwardRequestData calldata request) public view virtual returns (bool) {
        (bool alive, bool signerMatch, ) = _validate(request, nonces(request.from));
        return alive && signerMatch;
    }

    /**
     * @dev Executes a `request` on behalf of `signature`'s signer guaranteeing that the forwarded call
     * will receive the requested gas and no ETH is left stuck in the contract.
     */
    function execute(ForwardRequestData calldata request) public payable virtual returns (bool) {
        // This check can be before the call because _execute reverts with an invalid request.
        if (msg.value != request.value) {
            revert ERC2771ForwarderMismatchedValue(request.value, msg.value);
        }

        return _execute(request, _useNonce(request.from), true);
    }

    /**
     * @dev Batch version of {execute} with optional atomic behavior and refunding.
     *
     * The `atomic` parameter indicates whether all requests are executed or the whole
     * batch reverts if a single one of them is not a valid request as defined by {verify}.
     *
     * The `refundReceiver` is used for optionally send the funds back to a selected address in
     * case there's ETH left in the contract at the end of the execution instead of reverting. If
     * the provided refund receiver is the `address(0)`, the contract will revert with an
     * {ERC2771ForwarderMismatchedValue} error.
     *
     * NOTE: The `atomic` flag guarantees an all-or-nothing behavior only for the first level forwarded
     * calls. In case a call is forwarded to another contract, it may revert without the top-level call
     * reverting.
     */
    function executeBatch(
        ForwardRequestData[] calldata requests,
        bool atomic,
        address payable refundReceiver
    ) public payable virtual {
        uint256 requestsValue;
        uint256 spentValue;

        for (uint256 i; i < requests.length; ++i) {
            requestsValue += requests[i].value;
            bool success = _execute(requests[i], _useNonce(requests[i].from), atomic);
            if (success) {
                // Will never reallistically overflow given _execute will natively revert at
                // some point due to insufficient balance.
                unchecked {
                    spentValue += requests[i].value;
                }
            }
        }

        if (requestsValue != spentValue) {
            if (refundReceiver == address(0)) {
                revert ERC2771ForwarderMismatchedValue(requestsValue, msg.value);
            }

            // To avoid unexpected reverts because a request was frontrunned leaving ETH in the contract
            // the value is sent back instead of reverting.
            Address.sendValue(refundReceiver, requestsValue - spentValue);
        }
    }

    /**
     * @dev Validates if the provided request can be executed at current block with `request.signature`
     * on behalf of `request.signer`.
     *
     * Internal function without nonce validation.
     */
    function _validate(
        ForwardRequestData calldata request,
        uint256 nonce
    ) internal view virtual returns (bool alive, bool signerMatch, address signer) {
        signer = _recoverForwardRequestSigner(request, nonce);
        return (request.deadline >= block.timestamp, signer == request.from, signer);
    }

    /**
     * @dev Recovers the signer of an EIP712 message hash for a forward `request` and its corresponding `signature`.
     * See {ECDSA-recover}.
     *
     * Internal function without nonce validation.
     */
    function _recoverForwardRequestSigner(
        ForwardRequestData calldata request,
        uint256 nonce
    ) internal view virtual returns (address) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        _FORWARD_REQUEST_TYPEHASH,
                        request.from,
                        request.to,
                        request.value,
                        request.gas,
                        nonce,
                        request.deadline,
                        keccak256(request.data)
                    )
                )
            ).recover(request.signature);
    }

    /**
     * @dev Validates and executes a signed request returning the request call `success` value.
     *
     * Internal function without nonce and msg.value validation.
     *
     * Requirements:
     *
     * - The request's deadline must have not passed.
     * - The request's from must be the request's signer.
     * - The caller must have provided enough gas to forward with the call.
     *
     * Emits an {ExecutedForwardRequest} event.
     *
     * IMPORTANT: Using this function doesn't check that all the `msg.value` was sent, potentially leaving
     * ETH stuck in the contract.
     */
    function _execute(
        ForwardRequestData calldata request,
        uint256 nonce,
        bool requireValidRequest
    ) internal virtual returns (bool success) {
        (bool alive, bool signerMatch, address signer) = _validate(request, nonce);

        // Need to explicitly specify if a revert is required since non-reverting is default for
        // batches and reversion is opt-in since it could be useful in some scenarios
        if (requireValidRequest) {
            if (!alive) {
                revert ERC2771ForwarderExpiredRequest(request.deadline);
            }

            if (!signerMatch) {
                revert ERC2771ForwarderInvalidSigner(signer, request.from);
            }
        }

        // Avoid execution instead of reverting in case a batch includes an already executed request
        if (signerMatch && alive) {
            (success, ) = request.to.call{gas: request.gas, value: request.value}(
                abi.encodePacked(request.data, request.from)
            );

            _checkForwardedGas(request);

            emit ExecutedForwardRequest(signer, nonce, success);
        }
    }

    /**
     * @dev Checks if the requested gas was correctly forwarded to the callee.
     *
     * As a consequence of https://eips.ethereum.org/EIPS/eip-150[EIP-150]:
     * - At most `gasleft() - floor(gasleft() / 64)` is forwarded to the callee.
     * - At least `floor(gasleft() / 64)` is kept in the caller.
     *
     * It reverts consuming all the available gas if the forwarded gas is not the requested gas.
     *
     * IMPORTANT: This function should be called exactly the end of the forwarded call. Any gas consumed
     * in between will make room for bypassing this check.
     */
    function _checkForwardedGas(ForwardRequestData calldata request) private view {
        // To avoid insufficient gas griefing attacks, as referenced in https://ronan.eth.limo/blog/ethereum-gas-dangers/
        //
        // A malicious relayer can attempt to shrink the gas forwarded so that the underlying call reverts out-of-gas
        // and the top-level call still passes, so in order to make sure that the subcall received the requested gas,
        // the define this model and adding a check:
        //
        // Let X be the gas available before the subcall, such that the subcall gets X * 63 / 64.
        // We can't know X after CALL dynamic costs, but we want it to be such that X * 63 / 64 >= req.gas.
        // Let Y be the gas used in the subcall gasleft() measured immediately after the subcall will be gasleft() = X - Y.
        // If the subcall ran out of gas, then Y = X * 63 / 64 and gasleft() = X - Y = X / 64.
        // Then we restrict the model by checking if req.gas / 63 > gasleft(), which is true is true if and only if
        // req.gas / 63 > X / 64, or equivalently req.gas > X * 63 / 64.
        //
        // This means that if the subcall runs out of gas we are able to detect that insufficient gas was passed.
        // We will now also see that req.gas / 63 > gasleft() implies that req.gas >= X * 63 / 64.
        // The contract guarantees Y <= req.gas, thus gasleft() = X - Y >= X - req.gas.
        // -    req.gas / 63 > gasleft()
        // -    req.gas / 63 >= X - req.gas
        // -    req.gas >= X * 63 / 64
        //
        // In other words if req.gas < X * 63 / 64 then req.gas / 63 <= gasleft(), thus if the relayer behaves honestly
        // the relay does not revert.
        if (gasleft() < request.gas / 63) {
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
