// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/ERC20FlashMint.sol";

contract ERC20FlashMintMock is ERC20FlashMint {
    uint256 _flashFeeAmount;
    address _flashFeeReceiverAddress;

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

    function setFlashFee(uint256 amount) public {
        _flashFeeAmount = amount;
    }

    function flashFee(address token, uint256 amount) public view virtual override returns (uint256) {
        super.flashFee(token, amount);
        return _flashFeeAmount;
    }

    function setFlashFeeReceiver(address receiver) public {
        _flashFeeReceiverAddress = receiver;
    }

    function flashFeeReceiver() public view returns (address) {
        return _flashFeeReceiver();
    }

    function _flashFeeReceiver() internal view override returns (address) {
        return _flashFeeReceiverAddress;
    }
}
