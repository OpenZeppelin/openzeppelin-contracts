// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.7.0) (utils/RelayedCall.sol)

pragma solidity ^0.8.20;

/**
 * @dev Library for performing external calls through dynamically deployed relay contracts that hide the original
 * caller's address from the target contract. This pattern is used in ERC-4337's EntryPoint for account factory
 * calls and ERC-6942 for safe factory interactions.
 *
 * When privileged contracts need to make arbitrary external calls based on user input, calling the target directly
 * can be risky because the target sees the privileged contract as `msg.sender` and could exploit this trust
 * relationship. This library solves this by deploying minimal relay contracts that act as intermediaries, ensuring
 * the target only sees the unprivileged relay address as `msg.sender`.
 *
 * For example, instead of `target.call(data)` where the target sees this contract as `msg.sender`, use
 * {relayCall} where the target sees a relay address as `msg.sender`.
 *
 * NOTE: This library uses the PUSH0 opcode that was introduced in the Shanghai hardfork. While this instruction is
 * now widely supported, developers using the library on exotic chains should verify that their target chain has
 * supports for EIP-3855.
 */
library RelayedCall {
    /// @dev Relays a call to the target contract through a dynamically deployed relay contract.
    function relayCall(address target, bytes memory data) internal returns (bool success, bytes memory retData) {
        return relayCall(target, 0, data, bytes32(0));
    }

    /// @dev Same as {relayCall-address-bytes} but with a value.
    function relayCall(
        address target,
        uint256 value,
        bytes memory data
    ) internal returns (bool success, bytes memory retData) {
        return relayCall(target, value, data, bytes32(0));
    }

    /// @dev Same as {relayCall-address-bytes} but with a salt.
    function relayCall(
        address target,
        bytes memory data,
        bytes32 salt
    ) internal returns (bool success, bytes memory retData) {
        return relayCall(target, 0, data, salt);
    }

    /// @dev Same as {relayCall-address-bytes} but with a salt and a value.
    function relayCall(
        address target,
        uint256 value,
        bytes memory data,
        bytes32 salt
    ) internal returns (bool success, bytes memory retData) {
        return getRelayer(salt).call{value: value}(abi.encodePacked(target, data));
    }

    /// @dev Same as {getRelayer} but with a `bytes32(0)` default salt.
    function getRelayer() internal returns (address) {
        return getRelayer(bytes32(0));
    }

    /// @dev Returns the relayer address for a given salt.
    function getRelayer(bytes32 salt) internal returns (address relayer) {
        // Bytecode compiled from contracts/utils/RelayedCall.yul. The initcode is followed by the ABI-encoded factory
        // address, which the constructor stores as an immutable in the deployed code.
        // deployment prefix: 0x60538060175f396020606a823980515f600501525ff3fe
        // deployed bytecode: 0x601436107f<factory>33141517604f575f80366013190180601483378134813560601c5af13d5f803e604b573d5ffd5b3d5ff35b5f80fd
        assembly ("memory-safe") {
            let fmp := mload(0x40)

            // build initcode at FMP + 0x16 (0x6a bytes of code followed by the factory address)
            mstore(add(fmp, 0x00), 0x60538060175f39602060)
            mstore(add(fmp, 0x20), 0x6a823980515f600501525ff3fe601436107f0000000000000000000000000000)
            mstore(add(fmp, 0x40), 0x33141517604f575f803660131901)
            mstore(add(fmp, 0x60), 0x80601483378134813560601c5af13d5f803e604b573d5ffd5b3d5ff35b5f80fd)
            mstore(add(fmp, 0x80), address())
            let initcodehash := keccak256(add(fmp, 0x16), 0x8a)

            // compute create2 address
            mstore(0x40, initcodehash)
            mstore(0x20, salt)
            mstore(0x00, address())
            mstore8(0x0b, 0xff)
            relayer := and(keccak256(0x0b, 0x55), shr(96, not(0)))

            // is relayer not yet deployed, deploy it
            if iszero(extcodesize(relayer)) {
                if iszero(create2(0, add(fmp, 0x16), 0x8a, salt)) {
                    returndatacopy(fmp, 0x00, returndatasize())
                    revert(fmp, returndatasize())
                }
            }

            // cleanup fmp space used as scratch
            mstore(0x40, fmp)
        }
    }
}
