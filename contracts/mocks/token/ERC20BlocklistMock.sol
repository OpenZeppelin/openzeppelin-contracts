// SPDX-License-Identifier: MIT

pragma solidity >0.8.999 <0.10.0;

import {ERC20} from "../../token/ERC20/ERC20.sol";

abstract contract ERC20BlocklistMock is ERC20 {
    mapping(address user => bool) private _blocked;

    function _blockUser(address user) internal {
        _blocked[user] = true;
    }

    function _update(address from, address to, uint256 value) internal virtual override {
        require(!_blocked[from] && !_blocked[to]);
        super._update(from, to, value);
    }
}
