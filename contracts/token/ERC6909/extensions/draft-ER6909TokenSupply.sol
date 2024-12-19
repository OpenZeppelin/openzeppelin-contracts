// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC6909} from "../draft-ERC6909.sol";
import {IERC6909TokenSupply} from "../../../interfaces/draft-IERC6909.sol";

contract ER6909TokenSupply is ERC6909, IERC6909TokenSupply {
    mapping(uint256 id => uint256) private _totalSupplies;

    function totalSupply(uint256 id) external view virtual override returns (uint256) {
        return _totalSupplies[id];
    }

    function _update(address from, address to, uint256 id, uint256 amount) internal virtual override {
        super._update(from, to, id, amount);

        if (from == address(0)) {
            _totalSupplies[id] += amount;
        } else if (to == address(0)) {
            _totalSupplies[id] -= amount;
        }
    }
}
