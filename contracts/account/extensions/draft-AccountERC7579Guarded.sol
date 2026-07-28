// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (account/extensions/draft-AccountERC7579Guarded.sol)

pragma solidity ^0.8.26;

import {AccountERC7579} from "./draft-AccountERC7579.sol";

/**
 * @dev Extension of {AccountERC7579} that adds a trusted `guardian` (enforced by the {onlyGuardian} modifier) and
 * a guardian-gated {forceUninstall} escape hatch, to remove a module that blocks its own uninstallation by reverting
 * in {IERC7579Module-onUninstall} (or, under {AccountERC7579Hooked}, in {IERC7579Hook-preCheck}).
 *
 * The account keeps no scheduling state — all timing (schedule/delay/execute/cancel/audit) lives in the guardian.
 * The guardian is any contract that gates the call behind a delay before forwarding it, e.g. a
 * {TimelockController} (via `schedule`/`execute`) or a threshold multisig. For {AccessManager}-native gating
 * (per-selector execution delay), gate {forceUninstall} with {AccessManaged-restricted} instead.
 *
 * {forceUninstall} is not wrapped by `withHook`, so a hook that reverts in preCheck cannot block it. The guardian
 * is set once via {_setGuardian}; there is no rotation setter by design, since a rotatable guardian would let a
 * compromised owner re-point it at an instant executor and skip the delay.
 *
 * WARNING: This softens "modules control their own uninstallation" to "the guardian can override after its delay".
 * Its security rests entirely on that delay being meaningful. As with any uninstallation, removing the last
 * validator module renders the account inoperable.
 *
 * Usage:
 *
 * ```solidity
 * contract MyAccount is AccountERC7579Guarded {
 *     constructor(address timelock) {
 *         _setGuardian(timelock); // e.g. a TimelockController
 *     }
 * }
 * ```
 *
 * Recovering from a bricked hook then goes through the guardian's own delay:
 * ```solidity
 * bytes memory call = abi.encodeCall(AccountERC7579Guarded.forceUninstall, (MODULE_TYPE_HOOK, hook, ""));
 * timelock.schedule(account, 0, call, 0, salt, delay);
 * // ...wait `delay`...
 * timelock.execute(account, 0, call, 0, salt);
 * ```
 */
abstract contract AccountERC7579Guarded is AccountERC7579 {
    address private _guardian;

    /// @dev Emitted when the uninstall guardian is set.
    event UninstallGuardianSet(address indexed guardian);

    /// @dev The caller is not the configured guardian.
    error AccountUnauthorizedGuardian(address caller);

    modifier onlyGuardian() {
        _checkGuardian();
        _;
    }

    /**
     * @dev Force-uninstalls a module, bypassing {IERC7579Module-onUninstall} and any hook. Gated to the
     * `guardian`, which is responsible for enforcing a delay before the call reaches the account.
     *
     * Emits a {IERC7579ModuleConfig-ModuleUninstalled} event, like a regular uninstallation.
     */
    function forceUninstall(
        uint256 moduleTypeId,
        address module,
        bytes calldata deInitData
    ) public virtual onlyGuardian {
        _removeModule(moduleTypeId, module, deInitData);
        emit ModuleUninstalled(moduleTypeId, module);
    }

    /// @dev The trusted uninstall guardian, expected to be a timelock. Set once at construction/initialization.
    function guardian() public view virtual returns (address) {
        return _guardian;
    }

    /**
     * @dev Sets the guardian. Meant to be called once from the concrete account's constructor or initializer;
     * intentionally not exposed as a public setter (see the contract-level rationale).
     */
    function _setGuardian(address newGuardian) internal virtual {
        _guardian = newGuardian;
        emit UninstallGuardianSet(newGuardian);
    }

    /// @dev Reverts with {AccountUnauthorizedGuardian} if the caller is not the guardian.
    function _checkGuardian() internal view virtual {
        require(msg.sender == guardian(), AccountUnauthorizedGuardian(msg.sender));
    }
}
