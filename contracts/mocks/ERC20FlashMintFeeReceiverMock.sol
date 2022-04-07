// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC20FlashMint.sol";

contract ERC20FlashMintFeeReceiverMock is ERC20FlashMint {
    constructor(
        string memory name,
        string memory symbol,
        address initialAccount,
        uint256 initialBalance
    ) ERC20(name, symbol) {
        _mint(initialAccount, initialBalance);
    }

    function mint(address account, uint256 amount) public {
        _mint(account, amount);
    }

    function flashFee(address token, uint256 amount) public view virtual override returns (uint256) {
        token;
        amount;
        return 5000;
    }

    function mockFlashFeeReceiver(address token) public view returns (address) {
        return _flashFeeReceiver(token);
    }

    function _flashFeeReceiver(address token) override view internal returns(address) {
        token;
        return address(this);
    }
}