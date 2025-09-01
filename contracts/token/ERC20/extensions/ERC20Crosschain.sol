// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC20} from "../ERC20.sol";
import {BridgeERC20} from "../../../crosschain/bridges/BridgeERC20.sol";

abstract contract ERC20Crosschain is ERC20, BridgeERC20 {
    /// @dev TransferFrom variant of {crosschainTransferFrom}, using ERC20 allowance from the sender to the caller.
    function crosschainTransferFrom(address from, bytes memory to, uint256 amount) public virtual returns (bytes32) {
        _spendAllowance(from, msg.sender, amount);
        return _crosschainTransfer(from, to, amount);
    }

    /// @dev "Locking" tokens is achieved through burning
    function _lock(address from, uint256 amount) internal virtual override {
        _burn(from, amount);
    }

    /// @dev "Unlocking" tokens is achieved through minting
    function _unlock(address to, uint256 amount) internal virtual override {
        _mint(to, amount);
    }
}
