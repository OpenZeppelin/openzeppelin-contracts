// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC7540.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";

/**
 * @title ERC7540RedeemVault Asynchronous Redemption Tokenized Vaults
 * @dev Extension of ERC-4626 with asynchronous redemption support
 */
abstract contract ERC7540RedeemVault {
    // Mapping to track redeem requests
    mapping(address => uint256) public pendingRedeemRequest;

    // Events for deposit and redeem requests
    event RedeemRequest(address indexed sender, address indexed operator, address indexed owner, uint256 shares);

    /**
     * @dev Submits a request for an asynchronous redemption.
     */
    function requestRedeem(uint256 shares, address operator, address owner) public virtual {
        require(shares > 0, "ERC7540: Redeem amount must be greater than 0");
        require(shares <= balanceOf(owner), "ERC7540: Insufficient shares");

        // Transfer shares to the vault
        _transfer(owner, address(this), shares);

        // Update the pending redeem request
        pendingRedeemRequests[operator] += assets;

        emit RedeemRequest(msg.sender, operator, owner, shares);
    }

    /**
     * @dev Finalizes a redemption request by transferring assets to the receiver.
     * Shares should already be locked in the vault.
     */
    function redeem(uint256 shares, address receiver, address owner) public override returns (uint256) {
        uint256 requestedShares = pendingRedeemRequest[owner];
        require(requestedShares >= shares, "ERC7540: Redeem exceeds requested amount");
        
        // Calculate the amount of assets to return
        uint256 assets = convertToAssets(shares);

        // Transfer assets to the receiver
        _withdraw(owner, receiver, assets, shares);

        // Update the pending redeem request
        pendingRedeemRequest[owner] -= shares;

        return assets;
    }

    // Need to add logic here
    function withdraw(uint256 assets, address receiver, address owner) public virtual returns (uint256) {
        revert("ERC7540: Direct withdrawal not allowed in asynchronous redeem vaults");
    }

    /**
     * @dev Override previewDeposit to always revert.
     */
    function previewRedeem(uint256) public view override returns (uint256) {
        revert("ERC7540: Cannot preview asynchronous deposits");
    }

    /**
     * @dev Override previewMint to always revert.
     */
    function previewWithdraw(uint256) public view override returns (uint256) {
        revert("ERC7540: Cannot preview mint in asynchronous deposits");
    }
}