// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {IERC4626} from "../../../interfaces/IERC4626.sol";
import {ERC7540Deposit} from "./ERC7540Deposit.sol";
import {ERC7540Redeem} from "./ERC7540Redeem.sol";
import {ERC7540Operator} from "./ERC7540Operator.sol";
import {ERC20Vault} from "./ERC20Vault.sol";
import {IERC20Vault} from "./IERC20Vault.sol";
import {ERC165} from "../../../utils/introspection/ERC165.sol";

/**
 * @dev Implementation of the ERC-7540 "Asynchronous ERC-4626 Tokenized Vaults" as defined in
 * https://eips.ethereum.org/EIPS/eip-7540[ERC-7540].
 *
 * This extension adds support for asynchronous deposit and redemption flows to ERC-4626 vaults.
 * Users can request deposits or redemptions which enter a Pending state, transition to a Claimable state
 * when processed by the vault, and are finally Claimed using the standard ERC-4626 deposit/mint/withdraw/redeem methods.
 *
 * This contract combines {ERC7540Deposit} and {ERC7540Redeem} to provide a fully asynchronous vault.
 * For vaults that only require asynchronous deposits or redemptions, use the individual extensions instead.
 *
 * CAUTION: ERC-7540 introduces operator permissions that allow operators to manage requests on behalf of controllers.
 * Users should be cautious when approving operators as they gain significant control over both assets and shares.
 */
abstract contract ERC7540 is ERC165, ERC7540Redeem, ERC7540Deposit, IERC4626 {
    error ERC7540PreviewNotAvailable();

    /// @inheritdoc ERC7540Deposit
    function totalAssets()
        public
        view
        virtual
        override(ERC7540Deposit, ERC7540Operator, IERC20Vault)
        returns (uint256)
    {
        return super.totalAssets();
    }

    /// @inheritdoc IERC4626
    function previewDeposit(uint256 /* assets */) public view virtual returns (uint256) {
        revert ERC7540PreviewNotAvailable();
    }

    /// @inheritdoc IERC4626
    function previewMint(uint256 /* shares */) public view virtual returns (uint256) {
        revert ERC7540PreviewNotAvailable();
    }

    /// @inheritdoc IERC4626
    function previewWithdraw(uint256 /* assets */) public view virtual returns (uint256) {
        revert ERC7540PreviewNotAvailable();
    }

    /// @inheritdoc IERC4626
    function previewRedeem(uint256 /* shares */) public view virtual returns (uint256) {
        revert ERC7540PreviewNotAvailable();
    }

    /// @inheritdoc ERC20Vault
    function maxDeposit(
        address controller
    ) public view virtual override(ERC7540Deposit, ERC20Vault, IERC20Vault) returns (uint256) {
        return super.maxDeposit(controller);
    }

    /// @inheritdoc ERC20Vault
    function maxMint(
        address controller
    ) public view virtual override(ERC7540Deposit, ERC20Vault, IERC20Vault) returns (uint256) {
        return super.maxMint(controller);
    }

    /// @inheritdoc ERC20Vault
    function maxWithdraw(
        address controller
    ) public view virtual override(ERC7540Redeem, ERC20Vault, IERC20Vault) returns (uint256) {
        return super.maxWithdraw(controller);
    }

    /// @inheritdoc ERC20Vault
    function maxRedeem(
        address controller
    ) public view virtual override(ERC7540Redeem, ERC20Vault, IERC20Vault) returns (uint256) {
        return super.maxRedeem(controller);
    }

    /// @inheritdoc ERC165
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(ERC165, ERC7540Deposit, ERC7540Redeem) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /// @inheritdoc IERC4626
    function deposit(
        uint256 assets,
        address receiver
    ) public virtual override(ERC7540Deposit, IERC4626) returns (uint256) {
        return super.deposit(assets, receiver);
    }

    /// @inheritdoc IERC4626
    function mint(
        uint256 shares,
        address receiver
    ) public virtual override(ERC7540Deposit, IERC4626) returns (uint256) {
        return super.mint(shares, receiver);
    }

    /// @inheritdoc IERC4626
    function withdraw(
        uint256 assets,
        address receiver,
        address owner
    ) public virtual override(ERC7540Redeem, IERC4626) returns (uint256) {
        return super.withdraw(assets, receiver, owner);
    }

    /// @inheritdoc IERC4626
    function redeem(
        uint256 shares,
        address receiver,
        address owner
    ) public virtual override(ERC7540Redeem, IERC4626) returns (uint256) {
        return super.redeem(shares, receiver, owner);
    }
}
