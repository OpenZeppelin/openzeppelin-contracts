// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20, ERC20} from "../../../token/ERC20/ERC20.sol";
import {ERC20Permit} from "../../../token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "../../../token/ERC20/extensions/ERC20Votes.sol";
import {ERC20Wrapper} from "../../../token/ERC20/extensions/ERC20Wrapper.sol";
import {Nonces} from "../../../utils/Nonces.sol";

contract MyTokenWrapped is ERC20, ERC20Permit, ERC20Votes, ERC20Wrapper {
    constructor(
        IERC20 wrappedToken
    ) ERC20("MyTokenWrapped", "MTK") ERC20Permit("MyTokenWrapped") ERC20Wrapper(wrappedToken) {}

    // The functions below are overrides required by Solidity.

    function decimals() public view override(ERC20, ERC20Wrapper) returns (uint8) {
        return super.decimals();
    }

    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    function nonces(address owner) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
