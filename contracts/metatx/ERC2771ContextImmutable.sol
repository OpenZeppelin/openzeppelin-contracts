// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC2771ContextAbstract} from "./ERC2771ContextAbstract.sol";

/**
 * @dev Context variant with ERC2771 support and immutable trusted forwarder (less gas consumption).
 *
 * WARNING: Avoid using this pattern in contracts that rely in a specific calldata length as they'll
 * be affected by any forwarder whose `msg.data` is suffixed with the `from` address according to the ERC2771
 * specification adding the address size in bytes (20) to the calldata size. An example of an unexpected
 * behavior could be an unintended fallback (or another function) invocation while trying to invoke the `receive`
 * function only accessible if `msg.data.length == 0`.
 */
contract ERC2771ContextImmutable is ERC2771ContextAbstract {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    address private immutable _trustedForwarder;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(address trustedForwarder) {
        _trustedForwarder = trustedForwarder;
    }

    /// @notice return true if the address is a valid trusted forwarder
    /// @param forwarder trusted forwarder address to check
    /// @return true if the address is a valid trusted forwarder
    function _isTrustedForwarder(address forwarder) internal view virtual override returns (bool) {
        return forwarder == _trustedForwarder;
    }
}
