// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "../../../token/ERC20/ERC20.sol";
import {ERC20Permit} from "../../../token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "../../../token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "../../../utils/Nonces.sol";

contract MyTokenTimestampBased is ERC20, ERC20Permit, ERC20Votes {
    constructor() ERC20("MyTokenTimestampBased", "MTK") ERC20Permit("MyTokenTimestampBased") {}

    // Overrides IERC6372 functions to make the token & governor timestamp-based

    function clock() public view override returns (uint48) {
        return uint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public pure override returns (string memory) {
        return "mode=timestamp";
    }

    // The functions below are overrides required by Solidity.

    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._update(from, to, amount);
    }

    function nonces(address owner) public view virtual override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
