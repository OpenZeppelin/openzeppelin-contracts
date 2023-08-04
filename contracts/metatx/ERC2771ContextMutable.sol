// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC2771ContextAbstract} from "./ERC2771ContextAbstract.sol";

/**
 * @dev Context variant with ERC2771 support and mutable trusted forwarder (trusted forwarder can be changed or revoked) 
 *
 * WARNING: Avoid using this pattern in contracts that rely in a specific calldata length as they'll
 * be affected by any forwarder whose `msg.data` is suffixed with the `from` address according to the ERC2771
 * specification adding the address size in bytes (20) to the calldata size. An example of an unexpected
 * behavior could be an unintended fallback (or another function) invocation while trying to invoke the `receive`
 * function only accessible if `msg.data.length == 0`.
 */
contract ERC2771ContextMutable is ERC2771ContextAbstract {
    address private _trustedForwarder;

    /// @notice Emitted when a `newTrustedForwarder` is set, replacing the `oldTrustedForwarder`
    /// @param oldTrustedForwarder old trusted forwarder
    /// @param newTrustedForwarder new trusted forwarder
    /// @param operator the sender of the transaction
    event TrustedForwarderSet(
        address indexed oldTrustedForwarder,
        address indexed newTrustedForwarder,
        address indexed operator
    );

    /// @notice return the address of the trusted forwarder
    /// @return return the address of the trusted forwarder
    function getTrustedForwarder() external virtual view returns (address) {
        return _trustedForwarder;
    }

    /// @notice set the address of the trusted forwarder
    /// @param newForwarder the address of the new forwarder.
    function _setTrustedForwarder(address newForwarder) internal virtual {
        emit TrustedForwarderSet(_trustedForwarder, newForwarder, _msgSender());
        _trustedForwarder = newForwarder;
    }

    /// @notice return true if the address is a valid trusted forwarder
    /// @param forwarder trusted forwarder address to check
    /// @return true if the address is a valid trusted forwarder
    function _isTrustedForwarder(address forwarder) internal view virtual override returns (bool) {
        return forwarder == _trustedForwarder;
    }
}
