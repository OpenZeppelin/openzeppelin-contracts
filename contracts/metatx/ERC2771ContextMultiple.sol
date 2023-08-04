// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {EnumerableSet} from "../utils/structs/EnumerableSet.sol";
import {ERC2771ContextAbstract} from "./ERC2771ContextAbstract.sol";

/**
 * @dev Context variant with ERC2771 support a set of trusted forwarders 
 *
 * WARNING: Avoid using this pattern in contracts that rely in a specific calldata length as they'll
 * be affected by any forwarder whose `msg.data` is suffixed with the `from` address according to the ERC2771
 * specification adding the address size in bytes (20) to the calldata size. An example of an unexpected
 * behavior could be an unintended fallback (or another function) invocation while trying to invoke the `receive`
 * function only accessible if `msg.data.length == 0`.
 */
contract ERC2771ContextMultiple is ERC2771ContextAbstract {
    using EnumerableSet for EnumerableSet.AddressSet;
    EnumerableSet.AddressSet private _trustedForwarders;

    /// @notice Emitted when a `newTrustedForwarder` is set, replacing the `oldTrustedForwarder`
    /// @param newTrustedForwarder trusted forwarder to add
    /// @param operator the sender of the transaction
    event TrustedForwarderAdded(address indexed newTrustedForwarder, address indexed operator);

    /// @notice Emitted when a `newTrustedForwarder` is set, replacing the `oldTrustedForwarder`
    /// @param oldTrustedForwarder trusted forwarder to remove
    /// @param operator the sender of the transaction
    event TrustedForwarderRemoved(address indexed oldTrustedForwarder, address indexed operator);

    /// @notice return the address of the trusted forwarder
    /// @return return the address of the trusted forwarder
    function getTrustedForwarder(uint256 index) external virtual view returns (address) {
        return _trustedForwarders.at(index);
    }

    /// @notice return the address of the trusted forwarder
    /// @return return the address of the trusted forwarder
    function getTrustedForwarderLength() external virtual view returns (uint256) {
        return _trustedForwarders.length();
    }

    /// @notice set the address of the trusted forwarder
    /// @param newForwarder trusted forwarder to add
    function _addTrustedForwarder(address newForwarder) internal virtual {
        emit TrustedForwarderAdded(newForwarder, _msgSender());
        _trustedForwarders.add(newForwarder);
    }

    /// @notice set the address of the trusted forwarder
    /// @param oldForwarder trusted forwarder to remove
    function _removeTrustedForwarder(address oldForwarder) internal virtual {
        emit TrustedForwarderRemoved(oldForwarder, _msgSender());
        _trustedForwarders.remove(oldForwarder);
    }

    /// @notice return true if the address is a valid trusted forwarder
    /// @param forwarder trusted forwarder address to check
    /// @return true if the address is a valid trusted forwarder
    function _isTrustedForwarder(address forwarder) internal view virtual override returns (bool) {
        return _trustedForwarders.contains(forwarder);
    }
}
