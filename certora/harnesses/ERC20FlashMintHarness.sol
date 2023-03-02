// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../patched/token/ERC20/ERC20.sol";
import "../patched/token/ERC20/extensions/ERC20FlashMint.sol";

contract ERC20FlashMintHarness is ERC20, ERC20FlashMint {
    uint256 someFee;
    address someFeeReceiver;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

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
