// SPDX-License-Identifier: MIT

pragma solidity >=0.8.4;

/**
 * @dev Interface for operator management in https://eips.ethereum.org/EIPS/eip-7540[ERC-7540]
 * asynchronous vaults. Operators can manage deposit and redeem requests on behalf of a controller.
 */
interface IERC7540Operator {
    /// @dev Emitted when `controller` sets the `approved` status for an `operator`.
    event OperatorSet(address indexed controller, address indexed operator, bool approved);

    /**
     * @dev Grants or revokes permissions for `operator` to manage requests on behalf of the caller.
     *
     * * MUST set the operator status to the `approved` value.
     * * MUST emit the {OperatorSet} event when the operator status is set.
     * * MUST return true.
     */
    function setOperator(address operator, bool approved) external returns (bool);

    /// @dev Returns `true` if the `operator` is approved as an operator for an `controller`.
    function isOperator(address controller, address operator) external view returns (bool status);
}

/**
 * @dev Interface for asynchronous deposit requests in https://eips.ethereum.org/EIPS/eip-7540[ERC-7540]
 * vaults. Enables users to request deposits that transition through Pending and Claimable states
 * before being claimed via the standard ERC-4626 deposit/mint functions.
 */
interface IERC7540Deposit {
    /**
     * @dev Emitted when `owner` has locked `assets` in the Vault to request a deposit.
     * `controller` controls this request. `sender` is the caller of `requestDeposit`.
     */
    event DepositRequest(
        address indexed controller,
        address indexed owner,
        uint256 indexed requestId,
        address sender,
        uint256 assets
    );

    /**
     * @dev Transfers assets from sender into the Vault and submits a request for asynchronous deposit.
     *
     * * MUST support ERC-20 approve / transferFrom on asset as a deposit request flow.
     * * MUST revert if all of assets cannot be requested for deposit.
     * * MUST emit the {DepositRequest} event when the request is submitted.
     * * owner MUST be msg.sender unless some unspecified explicit approval is given by the caller,
     *    approval of ERC-20 tokens from owner to sender is NOT enough.
     *
     * NOTE: Most implementations will require `owner` to have approved the Vault to spend at least `assets` of
     * the underlying asset token (e.g. via `asset.approve(vault, assets)`) before calling this function.
     */
    function requestDeposit(uint256 assets, address controller, address owner) external returns (uint256 requestId);

    /**
     * @dev Returns the amount of requested assets in Pending state.
     *
     * * MUST NOT include any assets in Claimable state for deposit or mint.
     * * MUST NOT show any variations depending on the caller.
     * * MUST NOT revert unless due to integer overflow caused by an unreasonably large input.
     */
    function pendingDepositRequest(uint256 requestId, address controller) external view returns (uint256 pendingAssets);

    /**
     * @dev Returns the amount of requested assets in Claimable state for the controller to deposit or mint.
     *
     * * MUST NOT include any assets in Pending state.
     * * MUST NOT show any variations depending on the caller.
     * * MUST NOT revert unless due to integer overflow caused by an unreasonably large input.
     */
    function claimableDepositRequest(
        uint256 requestId,
        address controller
    ) external view returns (uint256 claimableAssets);

    /**
     * @dev Claims a pending deposit request by minting shares to receiver.
     * Decreases `claimableDepositRequest` for the controller and transfers shares to receiver.
     *
     * * MUST emit the Deposit event.
     * * MUST revert if controller does not have sufficient claimable assets.
     * * controller MUST equal msg.sender unless the controller has approved the msg.sender as an operator.
     */
    function deposit(uint256 assets, address receiver, address controller) external returns (uint256 shares);

    /**
     * @dev Claims a pending deposit request by minting exactly shares to receiver.
     * Decreases `claimableDepositRequest` for the controller and transfers shares to receiver.
     *
     * * MUST emit the Deposit event.
     * * MUST revert if controller does not have sufficient claimable assets.
     * * controller MUST equal msg.sender unless the controller has approved the msg.sender as an operator.
     */
    function mint(uint256 shares, address receiver, address controller) external returns (uint256 assets);
}

/**
 * @dev Interface for asynchronous redeem requests in https://eips.ethereum.org/EIPS/eip-7540[ERC-7540]
 * vaults. Enables users to request redemptions that transition through Pending and Claimable states
 * before being claimed via the standard ERC-4626 redeem/withdraw functions.
 */
interface IERC7540Redeem {
    /**
     * @dev Emitted when `sender` has locked `shares`, owned by `owner`, in the Vault to request a redemption.
     * `controller` controls this request.
     */
    event RedeemRequest(
        address indexed controller,
        address indexed owner,
        uint256 indexed requestId,
        address sender,
        uint256 shares
    );

    /**
     * @dev Assumes control of shares from sender into the Vault and submits a request for asynchronous redeem.
     *
     * * MUST support a redeem request flow where the control of shares is taken from sender directly
     *   where msg.sender has ERC-20 approval over the shares of owner.
     * * MUST revert if all of shares cannot be requested for redeem.
     * * MUST emit the RedeemRequest event.
     *
     * NOTE: Most implementations will require `owner` to have approved the Vault to spend at least `shares` of
     * the Vault's share token (e.g. via `share.approve(vault, shares)`) before calling this function.
     */
    function requestRedeem(uint256 shares, address controller, address owner) external returns (uint256 requestId);

    /**
     * @dev Returns the amount of requested shares in Pending state.
     *
     * * MUST NOT include any shares in Claimable state for redeem or withdraw.
     * * MUST NOT show any variations depending on the caller.
     * * MUST NOT revert unless due to integer overflow caused by an unreasonably large input.
     */
    function pendingRedeemRequest(uint256 requestId, address controller) external view returns (uint256 pendingShares);

    /**
     * @dev Returns the amount of requested shares in Claimable state for the controller to redeem or withdraw.
     *
     * * MUST NOT include any shares in Pending state for redeem or withdraw.
     * * MUST NOT show any variations depending on the caller.
     * * MUST NOT revert unless due to integer overflow caused by an unreasonably large input.
     */
    function claimableRedeemRequest(
        uint256 requestId,
        address controller
    ) external view returns (uint256 claimableShares);
}
