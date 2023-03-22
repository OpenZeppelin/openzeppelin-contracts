// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../patched/token/ERC20/ERC20.sol";
import "../patched/token/ERC20/extensions/ERC20Permit.sol";
import "../patched/token/ERC20/extensions/ERC20FlashMint.sol";

contract ERC20FlashMintHarness is ERC20, ERC20Permit, ERC20FlashMint {
    uint256 someFee;
    address someFeeReceiver;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) ERC20Permit(name) {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    // public accessor
    function flashFeeReceiver() public view returns (address) {
        return someFeeReceiver;
    }

    // internal hook
    function _flashFee(address, uint256) internal view override returns (uint256) {
        return someFee;
    }

    function _flashFeeReceiver() internal view override returns (address) {
        return someFeeReceiver;
    }
}
