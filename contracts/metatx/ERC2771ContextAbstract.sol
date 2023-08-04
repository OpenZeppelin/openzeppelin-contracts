// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Context} from "../utils/Context.sol";

/**
 * @dev Context variant with ERC2771 support.
 *
 * WARNING: Avoid using this pattern in contracts that rely in a specific calldata length as they'll
 * be affected by any forwarder whose `msg.data` is suffixed with the `from` address according to the ERC2771
 * specification adding the address size in bytes (20) to the calldata size. An example of an unexpected
 * behavior could be an unintended fallback (or another function) invocation while trying to invoke the `receive`
 * function only accessible if `msg.data.length == 0`.
 */
abstract contract ERC2771ContextAbstract is Context {
    /// @notice return true if the forwarder is the trusted forwarder
    /// @param forwarder trusted forwarder address to check
    /// @return true if the address is the same as the trusted forwarder
    function isTrustedForwarder(address forwarder) external virtual view returns (bool) {
        return _isTrustedForwarder(forwarder);
    }

    /// @notice if the call is from the trusted forwarder the sender is extracted from calldata, msg.sender otherwise
    /// @return sender the calculated address of the sender
    function _msgSender() internal view virtual override returns (address sender) {
        if (_isTrustedForwarder(msg.sender) && msg.data.length >= 20) {
            // The assembly code is more direct than the Solidity version using `abi.decode`.
            // solhint-disable-next-line no-inline-assembly
            assembly {
                sender := shr(96, calldataload(sub(calldatasize(), 20)))
            }
        } else {
            sender = msg.sender;
        }
    }

    /// @notice if the call is from the trusted forwarder the sender is removed from calldata
    /// @return the calldata without the sender
    function _msgData() internal view virtual override returns (bytes calldata) {
        if (_isTrustedForwarder(msg.sender) && msg.data.length >= 20) {
            return msg.data[:msg.data.length - 20];
        } else {
            return msg.data;
        }
    }

    /// @notice return true if the forwarder is the trusted forwarder
    /// @param forwarder trusted forwarder address to check
    /// @return true if the address is the same as the trusted forwarder
    /// @dev IMPLEMENT!!!
    function _isTrustedForwarder(address forwarder) internal view virtual returns (bool);
}
