// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {ERC20} from "../ERC20.sol";
import {BridgeERC20Core} from "../../../crosschain/bridges/BridgeERC20Core.sol";

/**
 * @dev Extension of {ERC20} that makes it natively cross-chain using the ERC-7786 based {BridgeERC20Core}.
 *
 * This extension makes the token compatible with counterparts on other chains, which can be:
 * * {ERC20Crosschain} instances,
 * * {ERC20} instances that are bridged using {BridgeERC20},
 * * {ERC20Bridgeable} instances that are bridged using {BridgeERC7802}.
 *
 * It is mostly equivalent to inheriting from both {ERC20Bridgeable} and {BridgeERC7802}, and configuring them such
 * that:
 * * `token` (on the {BridgeERC7802} side) is `address(this)`,
 * * `_checkTokenBridge` (on the {ERC20Bridgeable} side) is implemented such that it only accepts self-calls.
 */
// slither-disable-next-line locked-ether
abstract contract ERC20Crosschain is ERC20, BridgeERC20Core {
    /// @dev Variant of {crosschainTransfer} that allows an authorized account (using ERC20 allowance) to operate on `from`'s assets.
    function crosschainTransferFrom(address from, bytes memory to, uint256 amount) public virtual returns (bytes32) {
        _spendAllowance(from, _msgSender(), amount);
        return _crosschainTransfer(from, to, amount);
    }

    /// @dev "Locking" tokens is achieved through burning
    function _onSend(address from, uint256 amount) internal virtual override {
        _burn(from, amount);
    }

    /// @dev "Unlocking" tokens is achieved through minting
    function _onReceive(address to, uint256 amount) internal virtual override {
        _mint(to, amount);
    }
}
