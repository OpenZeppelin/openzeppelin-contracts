// SPDX-License-Identifier: MIT

pragma solidity >=0.6.2;

import {IERC20} from "../IERC20.sol";

/**
 * @dev Interface of a vault that is ERC-20 compliant and uses tokens for shares accounting.
 * Effectively a subset of https://eips.ethereum.org/EIPS/eip-4626[ERC-4626] interface that
 * does not enforce a deposit or withdraw flow.
 */
interface IERC20Vault {
    /**
     * @dev Returns the address of the underlying token used for the Vault for accounting, depositing, and withdrawing.
     *
     * * MUST be an ERC-20 token contract.
     * * MUST NOT revert.
     */
    function asset() external view returns (address assetTokenAddress);

    /**
     * @dev Returns the total amount of the underlying asset that is “managed” by Vault.
     *
     * * SHOULD include any compounding that occurs from yield.
     * * MUST be inclusive of any fees that are charged against assets in the Vault.
     * * MUST NOT revert.
     */
    function totalAssets() external view returns (uint256 totalManagedAssets);

    /**
     * @dev Returns the amount of shares that the Vault would exchange for the amount of assets provided, in an ideal
     * scenario where all the conditions are met.
     *
     * * MUST NOT be inclusive of any fees that are charged against assets in the Vault.
     * * MUST NOT show any variations depending on the caller.
     * * MUST NOT reflect slippage or other on-chain conditions, when performing the actual exchange.
     * * MUST NOT revert.
     *
     * NOTE: This calculation MAY NOT reflect the “per-user” price-per-share, and instead should reflect the
     * “average-user’s” price-per-share, meaning what the average user should expect to see when exchanging to and
     * from.
     */
    function convertToShares(uint256 assets) external view returns (uint256 shares);

    /**
     * @dev Returns the amount of assets that the Vault would exchange for the amount of shares provided, in an ideal
     * scenario where all the conditions are met.
     *
     * * MUST NOT be inclusive of any fees that are charged against assets in the Vault.
     * * MUST NOT show any variations depending on the caller.
     * * MUST NOT reflect slippage or other on-chain conditions, when performing the actual exchange.
     * * MUST NOT revert.
     *
     * NOTE: This calculation MAY NOT reflect the “per-user” price-per-share, and instead should reflect the
     * “average-user’s” price-per-share, meaning what the average user should expect to see when exchanging to and
     * from.
     */
    function convertToAssets(uint256 shares) external view returns (uint256 assets);

    /**
     * @dev Returns the maximum amount of the underlying asset that can be deposited into the Vault for the receiver,
     * through a deposit call.
     *
     * * MUST return a limited value if receiver is subject to some deposit limit.
     * * MUST return 2 ** 256 - 1 if there is no limit on the maximum amount of assets that may be deposited.
     * * MUST NOT revert.
     */
    function maxDeposit(address receiver) external view returns (uint256 maxAssets);

    /**
     * @dev Returns the maximum amount of the Vault shares that can be minted for the receiver, through a mint call.
     * * MUST return a limited value if receiver is subject to some mint limit.
     * * MUST return 2 ** 256 - 1 if there is no limit on the maximum amount of shares that may be minted.
     * * MUST NOT revert.
     */
    function maxMint(address receiver) external view returns (uint256 maxShares);

    /**
     * @dev Returns the maximum amount of the underlying asset that can be withdrawn from the owner balance in the
     * Vault, through a withdraw call.
     *
     * * MUST return a limited value if owner is subject to some withdrawal limit or timelock.
     * * MUST NOT revert.
     */
    function maxWithdraw(address owner) external view returns (uint256 maxAssets);

    /**
     * @dev Returns the maximum amount of Vault shares that can be redeemed from the owner balance in the Vault,
     * through a redeem call.
     *
     * * MUST return a limited value if owner is subject to some withdrawal limit or timelock.
     * * MUST return balanceOf(owner) if owner is not subject to any withdrawal limit or timelock.
     * * MUST NOT revert.
     */
    function maxRedeem(address owner) external view returns (uint256 maxShares);
}
