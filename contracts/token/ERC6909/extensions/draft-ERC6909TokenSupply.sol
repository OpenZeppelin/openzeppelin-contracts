// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.3.0) (token/ERC6909/extensions/draft-ERC6909TokenSupply.sol)

pragma solidity ^0.8.20;

import {ERC6909} from "../draft-ERC6909.sol";
import {IERC6909TokenSupply} from "../../../interfaces/draft-IERC6909.sol";

/**
 * @dev Implementation of the Token Supply extension defined in ERC6909.
 * Tracks the total supply of each token id individually.
 */
contract ERC6909TokenSupply is ERC6909, IERC6909TokenSupply {
    mapping(uint256 id => uint256) private _totalSupplies;

    /// @inheritdoc IERC6909TokenSupply
    function totalSupply(uint256 id) public view virtual override returns (uint256) {
        return _totalSupplies[id];
    }

    /// @dev Override the `_update` function to update the total supply of each token id as necessary.
    function _update(address from, address to, uint256 id, uint256 amount) internal virtual override {
        super._update(from, to, id, amount);

        if (from == address(0)) {
            _totalSupplies[id] += amount;
        }
        if (to == address(0)) {
            unchecked {
                // amount <= _balances[from][id] <= _totalSupplies[id]
                _totalSupplies[id] -= amount;
            }
        }
    }
}
