// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../ERC20.sol";
import "../utils/SafeERC20.sol";
import "../../../interfaces/draft-IERC4626.sol";

abstract contract ERC4626 is ERC20, IERC4626 {
    IERC20Metadata private immutable _asset;

    constructor(IERC20Metadata __asset) {
        _asset = __asset;
    }

    /** @dev See {IERC4262-asset} */
    function asset() public view virtual override returns (address) {
        return address(_asset);
    }

    /** @dev See {IERC4262-totalAssets} */
    function totalAssets() public view virtual override returns (uint256) {
        return _asset.balanceOf(address(this));
    }

    /** @dev See {IERC4262-convertToShares} */
    function convertToShares(uint256 assets) public view virtual override returns (uint256 shares) {
        return
            totalSupply() == 0 ? (assets * (10**decimals())) / (10**_asset.decimals()) : totalAssets() == 0
                ? type(uint256).max
                : (assets * totalSupply()) / totalAssets();
    }

    /** @dev See {IERC4262-convertToAssets} */
    function convertToAssets(uint256 shares) public view virtual override returns (uint256 assets) {
        return
            totalSupply() == 0
                ? (shares * (10**_asset.decimals())) / (10**decimals())
                : (shares * totalAssets()) / totalSupply();
    }

    /** @dev See {IERC4262-maxDeposit} */
    function maxDeposit(address) public view virtual override returns (uint256) {
        return type(uint256).max;
    }

    /** @dev See {IERC4262-maxMint} */
    function maxMint(address) public view virtual override returns (uint256) {
        return type(uint256).max;
    }

    /** @dev See {IERC4262-maxWithdraw} */
    function maxWithdraw(address owner) public view virtual override returns (uint256) {
        return convertToAssets(balanceOf(owner));
    }

    /** @dev See {IERC4262-maxRedeem} */
    function maxRedeem(address owner) public view virtual override returns (uint256) {
        return balanceOf(owner);
    }

    /** @dev See {IERC4262-previewDeposit} */
    function previewDeposit(uint256 assets) public view virtual override returns (uint256) {
        return convertToShares(assets); // TODO: apply fees?
    }

    /** @dev See {IERC4262-previewMint} */
    function previewMint(uint256 shares) public view virtual override returns (uint256) {
        return convertToAssets(shares); // TODO: apply fees?
    }

    /** @dev See {IERC4262-previewWithdraw} */
    function previewWithdraw(uint256 assets) public view virtual override returns (uint256) {
        return convertToShares(assets); // TODO: apply fees?
    }

    /** @dev See {IERC4262-previewRedeem} */
    function previewRedeem(uint256 shares) public view virtual override returns (uint256) {
        return convertToAssets(shares); // TODO: apply fees?
    }

    /** @dev See {IERC4262-deposit} */
    function deposit(uint256 assets, address receiver) public virtual override returns (uint256) {
        require(assets <= maxDeposit(receiver), "ERC4626: deposit more then max");

        address caller = _msgSender();
        uint256 shares = previewDeposit(assets);
        SafeERC20.safeTransferFrom(_asset, caller, address(this), assets);
        _mint(receiver, shares);

        emit Deposit(caller, receiver, assets, shares);

        return shares;
    }

    /** @dev See {IERC4262-mint} */
    function mint(uint256 shares, address receiver) public virtual override returns (uint256) {
        require(shares <= maxMint(receiver), "ERC4626: mint more then max");

        address caller = _msgSender();
        uint256 assets = previewMint(shares);
        SafeERC20.safeTransferFrom(_asset, caller, address(this), assets);
        _mint(receiver, shares);

        emit Deposit(caller, receiver, assets, shares);

        return assets;
    }

    /** @dev See {IERC4262-withdraw} */
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public virtual override returns (uint256) {
        require(assets <= maxWithdraw(owner), "ERC4626: withdraw more then max");

        address caller = _msgSender();
        uint256 shares = previewWithdraw(assets);

        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        _burn(owner, shares);
        SafeERC20.safeTransfer(_asset, receiver, assets);

        emit Withdraw(caller, receiver, owner, assets, shares);

        return shares;
    }

    /** @dev See {IERC4262-redeem} */
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public virtual override returns (uint256) {
        require(shares <= maxRedeem(owner), "ERC4626: redeem more then max");

        address caller = _msgSender();
        uint256 assets = previewRedeem(shares);

        if (caller != owner) {
            _spendAllowance(owner, caller, shares);
        }

        _burn(owner, shares);
        SafeERC20.safeTransfer(_asset, receiver, assets);

        emit Withdraw(caller, receiver, owner, assets, shares);

        return assets;
    }
}
