// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

/**
 * @dev Standard interface for permissioning originally defined in Dappsys.
 */
interface IAuthority {
    /**
     * @dev Returns true if the caller can invoke on a target the function identified by a function selector.
     */
    function canCall(address caller, address target, bytes4 selector) external view returns (bool allowed);
}

/**
 * @dev Since `AccessManager` implements an extended IAuthority interface, invoking `canCall` with backwards compatibility
 * for the preexisting `IAuthority` interface requires special care to avoid reverting on insufficient return data.
 * This helper function takes care of invoking `canCall` in a backwards compatible way without reverting.
 */
function safeCanCall(
    address authority,
    address caller,
    address target,
    bytes4 selector
) view returns (bool allowed, uint32 delay) {
    (bool success, bytes memory data) = authority.staticcall(
        abi.encodeCall(IAuthority.canCall, (caller, target, selector))
    );
    if (success) {
        if (data.length >= 0x40) {
            (allowed, delay) = abi.decode(data, (bool, uint32));
        } else if (data.length >= 0x20) {
            allowed = abi.decode(data, (bool));
        }
    }
    return (allowed, delay);
}
