// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v4.9.0) (metatx/MinimalForwarder.sol)

pragma solidity ^0.8.19;

import "../utils/cryptography/ECDSA.sol";
import "../utils/cryptography/EIP712.sol";
import "../utils/Nonces.sol";

/**
 * @dev A minimal implementation of a production-ready forwarder compatible with ERC2771 contracts.
 *
 * This forwarder operates on forward request that include:
 * * `from`: An address to operate on behalf of. It is required to be equal to `msg.sender`.
 * * `to`: An address destination to call within the request.
 * * `value`: The amount of ETH to attach within the requested call.
 * * `gas`: The amount of gas limit that will be forwarded within the requested call.
 * * `nonce`: A unique transaction ordering identifier to avoid replayability and request invalidation.
 * * `deadline`: A timestamp after which the request is not executable anymore.
 * * `data`: Encoded `msg.calldata` to send within the requested call.
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
     * @dev The request `value` doesn't match with the `msg.value`.
     */
    error MinimalForwaderMismatchedValue(uint256 msgValue, uint256 value);

    /**
     * @dev The list of requests length doesn't match with the list of signatures length.
     */
    error MinimalForwaderInvalidBatchLength(uint256 requestsLength, uint256 signaturesLength);

    /**
     * @dev The request `deadline` has expired.
     */
    error MinimalForwarderExpiredRequest(uint256 deadline);

    /**
     * @dev See {EIP7712-constructor}.
     */
    constructor(string memory name, string memory version) EIP712(name, version) {}

    /**
     * @dev Returns `true` if a request is valid for a provided `signature` at the current block.
     */
    function verify(ForwardRequest calldata request, bytes calldata signature) public view virtual returns (bool) {
        (bool alive, bool signerMatch, bool nonceMatch) = _validate(request, signature);
        return alive && signerMatch && nonceMatch;
    }

    /**
     * @dev Executes a `request` on behalf of `signature`'s signer.
     */
    function execute(
        ForwardRequest calldata request,
        bytes calldata signature
    ) public payable virtual returns (bool, bytes memory) {
        if (request.deadline < block.number) {
            revert MinimalForwarderExpiredRequest(request.deadline);
        }

        address signer = _recoverForwardRequestSigner(request, signature);
        if (signer != request.from) {
            revert MinimalForwarderInvalidSigner(signer, request.from);
        }

        if (msg.value != request.value) {
            revert MinimalForwaderMismatchedValue(msg.value, request.value);
        }

        _useCheckedNonce(request.from, request.nonce);

        // As a consequence of EIP-150, the maximum gas forwarded to a call is 63/64 of the remaining gas. So:
        // - At most `gasleft() - floor(gasleft() / 64)` is passed.
        // - At least `floor(gasleft() / 64)` is kept in the caller.
        // The current gas available is saved for later checking.
        uint256 gasBefore = gasleft();
        (bool success, bytes memory returndata) = request.to.call{gas: request.gas, value: request.value}(
            abi.encodePacked(request.data, request.from)
        );

        // To avoid gas griefing attacks, as referenced in https://ronan.eth.limo/blog/ethereum-gas-dangers/
        // A malicious relayer can attempt to manipulate the gas forwarded so that the underlying call reverts and
        // the top-level call still passes.
        // Such manipulation can be prevented by checking if `gasleft() < floor(gasBefore / 64)`. If so, we
        // can assume an out of gas error was forced in the subcall. There's no need to process such transactions.
        if (gasleft() < gasBefore / 64) {
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

    /**
     * @dev Validates if the provided request can be executed at `blockNumber` with `signature`.
     */
    function _validateAt(
        uint256 blockNumber,
        ForwardRequest calldata request,
        bytes calldata signature
    ) internal view virtual returns (bool alive, bool signerMatch, bool nonceMatch) {
        address signer = _recoverForwardRequestSigner(request, signature);
        return (request.deadline >= blockNumber, signer == request.from, nonces(request.from) == request.nonce);
    }

    /**
     * @dev Same as {_validateAt} but for the current block.
     */
    function _validate(
        ForwardRequest calldata request,
        bytes calldata signature
    ) internal view virtual returns (bool alive, bool signerMatch, bool nonceMatch) {
        return _validateAt(block.number, request, signature);
    }

    /**
     * @dev Recovers the signer of an EIP712 message hash for a forward `request`
     * and its corresponding `signature`. See {ECDSA-recover}.
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
}
