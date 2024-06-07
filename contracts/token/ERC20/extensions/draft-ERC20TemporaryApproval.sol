// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC20} from "../ERC20.sol";
import {IERC7674} from "../../../interfaces/draft-IERC7674.sol";
import {Math} from "../../../utils/math/Math.sol";
import {SlotDerivation} from "../../../utils/SlotDerivation.sol";
import {StorageSlot} from "../../../utils/StorageSlot.sol";

/**
 * @dev Extension of {ERC20} that adds support for temporary allowances following ERC-7674.
 *
 * WARNING: This is a draft contract. The corresponding ERC is still subject to changes.
 */
abstract contract ERC20TemporaryApproval is ERC20, IERC7674 {
    using SlotDerivation for bytes32;
    using StorageSlot for bytes32;
    using StorageSlot for StorageSlot.Uint256SlotType;

    // keccak256(abi.encode(uint256(keccak256("openzeppelin.storage.ERC20TemporaryApproval")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant ERC20TemporaryApprovalStorageLocation =
        0x0fd66af0be6cb88466bb5c49c7ea8fbb4acdc82057e863d0a17fddeaaf18fe00;

    /**
     * @dev {allowance} override that includes the temporary allowance when looking up the current allowance. If
     * adding up the persistent and the temporary allowances result in an overflow, type(uint256).max is returned.
     */
    function allowance(address owner, address spender) public view virtual override returns (uint256) {
        (bool success, uint256 amount) = Math.tryAdd(
            super.allowance(owner, spender),
            _loadTemporaryAllowance(owner, spender)
        );
        return success ? amount : type(uint256).max;
    }

    /**
     * @dev Alternative to {approve} that sets a `value` amount of tokens as the temporary allowance of `spender` over
     * the caller's tokens.
     *
     * Returns a boolean value indicating whether the operation succeeded.
     *
     * Does NOT emit an {Approval} event.
     */
    function temporaryApprove(address spender, uint256 value) public virtual returns (bool) {
        address owner = _msgSender();
        _storeTemporaryAllowance(owner, spender, value);
        return true;
    }

    /**
     * @dev {_spendAllowance} override that consumes the temporary allowance (if any) before eventually falling back
     * to consumming the persistent allowance.
     */
    function _spendAllowance(address owner, address spender, uint256 value) internal virtual override {
        unchecked {
            // load transient allowance
            uint256 currentTemporaryAllowance = _loadTemporaryAllowance(owner, spender);
            // if there is temporary allowance
            if (currentTemporaryAllowance > 0) {
                // if infinite, do nothing
                if (currentTemporaryAllowance == type(uint256).max) return;
                // check how much of the value is covered by the transient allowance
                uint256 spendTemporaryAllowance = Math.min(currentTemporaryAllowance, value);
                // decrease transient allowance accordingly
                _storeTemporaryAllowance(owner, spender, currentTemporaryAllowance - spendTemporaryAllowance);
                // update value necessary
                value -= spendTemporaryAllowance;
            }
            // reduce any remaining value from the persistent allowance
            super._spendAllowance(owner, spender, value);
        }
    }

    function _loadTemporaryAllowance(address owner, address spender) private view returns (uint256) {
        return ERC20TemporaryApprovalStorageLocation.deriveMapping(owner).deriveMapping(spender).asUint256().tload();
    }

    function _storeTemporaryAllowance(address owner, address spender, uint256 value) private {
        ERC20TemporaryApprovalStorageLocation.deriveMapping(owner).deriveMapping(spender).asUint256().tstore(value);
    }
}
