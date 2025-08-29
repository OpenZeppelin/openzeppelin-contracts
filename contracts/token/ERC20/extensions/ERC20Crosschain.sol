// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {ERC20} from "../ERC20.sol";
import {CrosschainBridgeERC20} from "../../../crosschain/bridges/CrosschainBridgeERC20.sol";

abstract contract ERC20Crosschain is ERC20, CrosschainBridgeERC20 {
    /// @dev TransferFrom variant of {crosschainTransferFrom-bytes-uint256}, using ERC20 allowance from the sender to the caller.
    function crosschainTransferFrom(address from, bytes memory to, uint256 amount) public returns (bytes32) {
        return crosschainTransferFrom(from, to, amount, new bytes[](0));
    }

    /// @dev TransferFrom variant of {crosschainTransferFrom-bytes-uint256-bytes[]}, using ERC20 allowance from the sender to the caller.
    function crosschainTransferFrom(
        address from,
        bytes memory to,
        uint256 amount,
        bytes[] memory attributes
    ) public virtual returns (bytes32) {
        _spendAllowance(from, msg.sender, amount);
        return _crosschainTransfer(from, to, amount, attributes);
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
