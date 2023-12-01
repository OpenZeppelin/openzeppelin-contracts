// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC7540.sol)

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";

/**
 * @title ERC7540DepositVault Asynchronous Deposit Tokenized Vaults
 * @dev Extension of ERC-4626 with asynchronous deposit support
 */
abstract contract ERC7540DepositVault {
    // Mapping to track pending deposit and redeem requests
    mapping(address => uint256) public pendingDepositRequest;

    // Events for deposit and redeem requests
    event DepositRequest(address indexed sender, address indexed operator, uint256 assets);

    /**
     * @dev Submits a request for an asynchronous deposit.
     */
    function requestDeposit(uint256 assets, address operator) public virtual {
        require(assets > 0, "ERC7540: Deposit amount must be greater than 0");
                
        // Transfer assets to the vault
        IERC20(asset()).transferFrom(msg.sender, address(this), assets);

        // Update the pending deposit request
        pendingRequests[operator] += assets;

        emit DepositRequest(msg.sender, operator, assets);
    }

    /**
     * @dev Finalizes a deposit request by minting shares to the receiver.
     * The assets must already be transferred to the vault.
     */
    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        uint256 requestedAssets = pendingDepositRequest[receiver];
        require(requestedAssets >= assets, "ERC7540: Deposit exceeds requested amount");
        
        // Calculate the number of shares to mint
        uint256 shares = convertToShares(assets);
        
        // Mint the shares to the receiver
        _mint(receiver, shares);

        // Update the pending deposit request
        pendingDepositRequest[receiver] -= assets;
        
        return shares;
    }

    /**
     * @dev Mint function to handle asynchronous deposit requests.
     * This function should revert as minting shares directly does not align with the asynchronous deposit workflow.
     */
    function mint(uint256, address) public override returns (uint256) {
        revert("ERC7540: Direct minting not allowed in asynchronous deposit vaults");
    }


    /**
     * @dev Override previewDeposit to always revert.
     */
    function previewDeposit(uint256) public view override returns (uint256) {
        revert("ERC7540: Cannot preview asynchronous deposits");
    }

    /**
     * @dev Override previewMint to always revert.
     */
    function previewMint(uint256) public view override returns (uint256) {
        revert("ERC7540: Cannot preview mint in asynchronous deposits");
    }
}