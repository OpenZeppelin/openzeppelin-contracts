// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.2.0) (proxy/beacon/BeaconProxy.sol)

pragma solidity ^0.8.22;

import {ERC1967Utils} from "../ERC1967/ERC1967Utils.sol";
import {Proxy} from "../Proxy.sol";
import {IBeacon} from "./IBeacon.sol";

/**
 * @dev This contract implements a proxy that gets the implementation address for each call from an {UpgradeableBeacon}.
 *
 * The beacon address can only be set once during construction, and cannot be changed afterwards. It is stored in an
 * immutable variable to avoid unnecessary storage reads, and also in the beacon storage slot specified by
 * https://eips.ethereum.org/EIPS/eip-1967[ERC-1967] so that it can be accessed externally.
 *
 * CAUTION: Since the beacon address can never be changed, you must ensure that you either control the beacon, or trust
 * the beacon to not upgrade the implementation maliciously.
 *
 * IMPORTANT: Do not use the implementation logic to modify the beacon storage slot. Doing so would leave the proxy in
 * an inconsistent state where the beacon storage slot does not match the beacon address.
 */
contract BeaconProxy is Proxy {
    // An immutable address for the beacon to avoid unnecessary SLOADs before each delegate call.
    address private immutable _beacon;

    /**
     * @dev The proxy is left uninitialized.
     */
    error BeaconProxyUninitialized();

    /**
     * @dev Initializes the proxy with `beacon`.
     *
     * Provided `data` is passed in a delegate call to the implementation returned by the beacon. This will typically
     * be an encoded function call, and allows initializing the storage of the proxy like a Solidity constructor. By
     * default construction will fail if `data` is empty. This behavior can be overridden using a custom
     * {_unsafeAllowUninitialized} that returns true. In that case, empty `data` is ignored and no delegate call to the
     * implementation is performed during construction.
     *
     * Requirements:
     *
     * - `beacon` must be a contract with the interface {IBeacon}.
     * - If `data` is empty, `msg.value` must be zero.
     */
    constructor(address beacon, bytes memory data) payable {
        if (!_unsafeAllowUninitialized() && data.length == 0) {
            revert BeaconProxyUninitialized();
        }
        ERC1967Utils.upgradeBeaconToAndCall(beacon, data);
        _beacon = beacon;
    }

    /**
     * @dev Returns the current implementation address of the associated beacon.
     */
    function _implementation() internal view virtual override returns (address) {
        return IBeacon(_getBeacon()).implementation();
    }

    /**
     * @dev Returns the beacon.
     */
    function _getBeacon() internal view virtual returns (address) {
        return _beacon;
    }

    /**
     * @dev Returns whether the proxy can be left uninitialized.
     *
     * NOTE: Override this function to allow the proxy to be left uninitialized.
     * Consider uninitialized proxies might be susceptible to man-in-the-middle threats
     * where the proxy is replaced with a malicious one.
     */
    function _unsafeAllowUninitialized() internal pure virtual returns (bool) {
        return false;
    }
}
