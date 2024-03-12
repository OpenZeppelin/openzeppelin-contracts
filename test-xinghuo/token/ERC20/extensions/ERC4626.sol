pragma solidity ^0.8.20;

import {ERC20} from "../../../../openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "../../../../openzeppelin-contracts/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC20} from "../../../../openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract MyERC20 is ERC20 {
    constructor(address acc, string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(acc, 100);
    }
}

contract MyERC4626 is ERC4626 {

    constructor(IERC20 asset_, string memory name_, string memory symbol_) ERC4626(asset_) ERC20(name_, symbol_) {

    }

    //decimals

    //asset

    //totalAssets

    //convertToShares

    //convertToAssets

    //maxDeposit

    //maxMint

    //maxWithdraw

    //maxRedeem

    //previewDeposit

    //previewMint

    //previewWithdraw

    //previewRedeem

    //deposit

    //mint

    //withdraw

    //redeem
}