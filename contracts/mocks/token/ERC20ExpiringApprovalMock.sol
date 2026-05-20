// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "../../token/ERC20/ERC20.sol";
import {ERC20ExpiringApproval} from "../../token/ERC20/extensions/draft-ERC20ExpiringApproval.sol";

abstract contract ERC20ExpiringApprovalMock is ERC20ExpiringApproval {
    function _isLegacyCompatibleSpender(address) internal view virtual override returns (bool) {
        return false;
    }
}

contract ERC20ExpiringApprovalLegacyMock is ERC20ExpiringApproval {
    mapping(address spender => bool) private _legacyCompatibleSpenders;

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {}

    function setLegacyCompatibleSpender(address spender, bool enabled) external {
        _legacyCompatibleSpenders[spender] = enabled;
    }

    function mint(address account, uint256 value) external {
        _mint(account, value);
    }

    function _isLegacyCompatibleSpender(address spender) internal view virtual override returns (bool) {
        return _legacyCompatibleSpenders[spender];
    }
}
