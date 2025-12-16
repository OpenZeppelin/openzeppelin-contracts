// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.4.0) (account/extensions/draft-AccountERC7579Hooked.sol)

pragma solidity ^0.8.26;

import {IERC7579Hook, MODULE_TYPE_HOOK} from "../../interfaces/draft-IERC7579.sol";
import {ERC7579Utils, Mode} from "../../account/utils/draft-ERC7579Utils.sol";
import {AccountERC7579} from "./draft-AccountERC7579.sol";

/**
 * @dev Extension of {AccountERC7579} with support for a single hook module (type 4).
 *
 * If installed, this extension will call the hook module's {IERC7579Hook-preCheck} before executing any operation
 * with {_execute} (including {execute} and {executeFromExecutor} by default) and {IERC7579Hook-postCheck} thereafter.
 *
 * NOTE: Hook modules break the check-effect-interaction pattern. In particular, the {IERC7579Hook-preCheck} hook can
 * lead to potentially dangerous reentrancy. Using the `withHook()` modifier is safe if no effect is performed
 * before the preHook or after the postHook. That is the case on all functions here, but it may not be the case if
 * functions that have this modifier are overridden. Developers should be extremely careful when implementing hook
 * modules or further overriding functions that involve hooks.
 */
abstract contract AccountERC7579Hooked is AccountERC7579 {
    address private _hook;

    /// @dev A hook module is already present. This contract only supports one hook module.
    error ERC7579HookModuleAlreadyPresent(address hook);

    /**
     * @dev Calls {IERC7579Hook-preCheck} before executing the modified function and {IERC7579Hook-postCheck}
     * thereafter.
     */
    modifier withHook() {
        address hook_ = hook();
        bytes memory hookData;

        // slither-disable-next-line reentrancy-no-eth
        if (hook_ != address(0)) hookData = IERC7579Hook(hook_).preCheck(msg.sender, msg.value, msg.data);
        _;
        if (hook_ != address(0)) IERC7579Hook(hook_).postCheck(hookData);
    }

    /// @inheritdoc AccountERC7579
    function accountId() public view virtual override returns (string memory) {
        // vendorname.accountname.semver
        return "@openzeppelin/contracts.AccountERC7579Hooked.v1.0.0";
    }

    /// @dev Returns the hook module address if installed, or `address(0)` otherwise.
    function hook() public view virtual returns (address) {
        return _hook;
    }

    /// @dev Supports hook modules. See {AccountERC7579-supportsModule}
    function supportsModule(uint256 moduleTypeId) public view virtual override returns (bool) {
        return moduleTypeId == MODULE_TYPE_HOOK || super.supportsModule(moduleTypeId);
    }

    /// @inheritdoc AccountERC7579
    function isModuleInstalled(
        uint256 moduleTypeId,
        address module,
        bytes calldata data
    ) public view virtual override returns (bool) {
        return
            (moduleTypeId == MODULE_TYPE_HOOK && module == hook()) ||
            super.isModuleInstalled(moduleTypeId, module, data);
    }

    /// @dev Installs a module with support for hook modules. See {AccountERC7579-_installModule}
    function _installModule(
        uint256 moduleTypeId,
        address module,
        bytes memory initData
    ) internal virtual override withHook {
        if (moduleTypeId == MODULE_TYPE_HOOK) {
            require(_hook == address(0), ERC7579HookModuleAlreadyPresent(_hook));
            _hook = module;
        }
        super._installModule(moduleTypeId, module, initData);
    }

    /// @dev Uninstalls a module with support for hook modules. See {AccountERC7579-_uninstallModule}
    function _uninstallModule(
        uint256 moduleTypeId,
        address module,
        bytes memory deInitData
    ) internal virtual override withHook {
        if (moduleTypeId == MODULE_TYPE_HOOK) {
            require(_hook == module, ERC7579Utils.ERC7579UninstalledModule(moduleTypeId, module));
            _hook = address(0);
        }
        super._uninstallModule(moduleTypeId, module, deInitData);
    }

    /// @dev Hooked version of {AccountERC7579-_execute}.
    function _execute(
        Mode mode,
        bytes calldata executionCalldata
    ) internal virtual override withHook returns (bytes[] memory) {
        return super._execute(mode, executionCalldata);
    }

    /// @dev Hooked version of {AccountERC7579-_fallback}.
    function _fallback() internal virtual override withHook returns (bytes memory) {
        return super._fallback();
    }
}
