// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.5.0) (account/extensions/draft-ERC7821.sol)

pragma solidity ^0.8.20;

import {ERC7579Utils, Mode, CallType, ExecType, ModeSelector} from "../utils/draft-ERC7579Utils.sol";
import {IERC7821} from "../../interfaces/draft-IERC7821.sol";
import {Account} from "../Account.sol";

/**
 * @dev Minimal batch executor following ERC-7821.
 *
 * Only supports single batch mode (`0x01000000000000000000`). Does not support optional "opData".
 *
 * @custom:stateless
 */
abstract contract ERC7821 is IERC7821 {
    using ERC7579Utils for *;

    error UnsupportedExecutionMode();

    /**
     * @dev Executes the calls in `executionData` with no optional `opData` support.
     *
     * NOTE: Access to this function is controlled by {_erc7821AuthorizedExecutor}. Changing access permissions, for
     * example to approve calls by the ERC-4337 entrypoint, should be implemented by overriding it.
     *
     * Reverts and bubbles up error if any call fails.
     */
    function execute(bytes32 mode, bytes calldata executionData) public payable virtual {
        if (!_erc7821AuthorizedExecutor(msg.sender, mode, executionData))
            revert Account.AccountUnauthorized(msg.sender);
        if (!supportsExecutionMode(mode)) revert UnsupportedExecutionMode();
        executionData.execBatch(ERC7579Utils.EXECTYPE_DEFAULT);
    }

    /// @inheritdoc IERC7821
    function supportsExecutionMode(bytes32 mode) public view virtual returns (bool result) {
        (CallType callType, ExecType execType, ModeSelector modeSelector, ) = Mode.wrap(mode).decodeMode();
        return
            callType == ERC7579Utils.CALLTYPE_BATCH &&
            execType == ERC7579Utils.EXECTYPE_DEFAULT &&
            modeSelector == ModeSelector.wrap(0x00000000);
    }

    /**
     * @dev Access control mechanism for the {execute} function.
     * By default, only the contract itself is allowed to execute.
     *
     * Override this function to implement custom access control, for example to allow the
     * ERC-4337 entrypoint to execute.
     *
     * ```solidity
     * function _erc7821AuthorizedExecutor(
     *   address caller,
     *   bytes32 mode,
     *   bytes calldata executionData
     * ) internal view virtual override returns (bool) {
     *   return caller == address(entryPoint()) || super._erc7821AuthorizedExecutor(caller, mode, executionData);
     * }
     * ```
     */
    function _erc7821AuthorizedExecutor(
        address caller,
        bytes32 /* mode */,
        bytes calldata /* executionData */
    ) internal view virtual returns (bool) {
        return caller == address(this);
    }
}
