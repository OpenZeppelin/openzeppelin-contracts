// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../token/ERC20/ERC20.sol";
import "../token/ERC20/extensions/ERC4626.sol";
import "hardhat/console.sol";

contract ERC4626ReentrantAsset is ERC20("TEST", "TST") {
    bool _entered;
    bool _canReenter;

    function setReenter(bool reenter) external {
        _canReenter = reenter;
    }
}

contract ERC4626DepositReentrantAsset is ERC4626ReentrantAsset {
    function _beforeTokenTransfer(address, address to, uint256) internal override {
        if (_canReenter && !_entered) {
            _entered = true;
            this.approve(msg.sender, 1);
            IERC4626(msg.sender).deposit(1, to);
        }
    }
}

contract ERC4626WithdrawReentrantAsset is ERC4626ReentrantAsset {
    /**
     * @dev Simulates a deposit before enabling the withdraw reentrancy
     */
    function depositTo(address vault, uint256 amount) external {
        this.approve(vault, amount);
        IERC4626(vault).deposit(amount, address(this));
    }

    function _afterTokenTransfer(address, address to, uint256) internal override {
        if (_canReenter && !_entered) {
            _entered = true;
            IERC4626(msg.sender).withdraw(1, to, address(this));
        }
    }
}
