// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (interfaces/IERC7540.sol)

pragma solidity ^0.8.20;

interface IERC7540Operator {
    /**
     * @dev The event emitted when an operator is set.
     *
     * @param controller The address of the controller.
     * @param operator The address of the operator.
     * @param approved The approval status.
     */
    event OperatorSet(address indexed controller, address indexed operator, bool approved);

    /**
     * @dev Sets or removes an operator for the caller.
     *
     * @param operator The address of the operator.
     * @param approved The approval status.
     * @return Whether the call was executed successfully or not
     */
    function setOperator(address operator, bool approved) external returns (bool);

    /**
     * @dev Returns `true` if the `operator` is approved as an operator for an `controller`.
     *
     * @param controller The address of the controller.
     * @param operator The address of the operator.
     * @return status The approval status
     */
    function isOperator(address controller, address operator) external view returns (bool status);
}

interface IERC7540Deposit {
    event DepositRequest(
        address indexed controller, address indexed owner, uint256 indexed requestId, address sender, uint256 assets
    );
    /**
     * @dev Transfers assets from sender into the Vault and submits a Request for asynchronous deposit.
     *
     * - MUST support ERC-20 approve / transferFrom on asset as a deposit Request flow.
     * - MUST revert if all of assets cannot be requested for deposit.
     * - owner MUST be msg.sender unless some unspecified explicit approval is given by the caller,
     *    approval of ERC-20 tokens from owner to sender is NOT enough.
     *
     * @param assets the amount of deposit assets to transfer from owner
     * @param controller the controller of the request who will be able to operate the request
     * @param owner the source of the deposit assets
     *
     * NOTE: most implementations will require pre-approval of the Vault with the Vault's underlying asset token.
     */

    function requestDeposit(uint256 assets, address controller, address owner) external returns (uint256 requestId);

    /**
     * @dev Returns the amount of requested assets in Pending state.
     *
     * - MUST NOT include any assets in Claimable state for deposit or mint.
     * - MUST NOT show any variations depending on the caller.
     * - MUST NOT revert unless due to integer overflow caused by an unreasonably large input.
     */
    function pendingDepositRequest(uint256 requestId, address controller)
        external
        view
        returns (uint256 pendingAssets);

    /**
     * @dev Returns the amount of requested assets in Claimable state for the controller to deposit or mint.
     *
     * - MUST NOT include any assets in Pending state.
     * - MUST NOT show any variations depending on the caller.
     * - MUST NOT revert unless due to integer overflow caused by an unreasonably large input.
     */
    function claimableDepositRequest(uint256 requestId, address controller)
        external
        view
        returns (uint256 claimableAssets);

    /**
     * @dev Mints shares Vault shares to receiver by claiming the Request of the controller.
     *
     * - MUST emit the Deposit event.
     * - controller MUST equal msg.sender unless the controller has approved the msg.sender as an operator.
     */
    function deposit(uint256 assets, address receiver, address controller) external returns (uint256 shares);

    /**
     * @dev Mints exactly shares Vault shares to receiver by claiming the Request of the controller.
     *
     * - MUST emit the Deposit event.
     * - controller MUST equal msg.sender unless the controller has approved the msg.sender as an operator.
     */
    function mint(uint256 shares, address receiver, address controller) external returns (uint256 assets);
}

interface IERC7540Redeem {
    event RedeemRequest(
        address indexed controller, address indexed owner, uint256 indexed requestId, address sender, uint256 assets
    );

    /**
     * @dev Assumes control of shares from sender into the Vault and submits a Request for asynchronous redeem.
     *
     * - MUST support a redeem Request flow where the control of shares is taken from sender directly
     *   where msg.sender has ERC-20 approval over the shares of owner.
     * - MUST revert if all of shares cannot be requested for redeem.
     *
     * @param shares the amount of shares to be redeemed to transfer from owner
     * @param controller the controller of the request who will be able to operate the request
     * @param owner the source of the shares to be redeemed
     *
     * NOTE: most implementations will require pre-approval of the Vault with the Vault's share token.
     */
    function requestRedeem(uint256 shares, address controller, address owner) external returns (uint256 requestId);

    /**
     * @dev Returns the amount of requested shares in Pending state.
     *
     * - MUST NOT include any shares in Claimable state for redeem or withdraw.
     * - MUST NOT show any variations depending on the caller.
     * - MUST NOT revert unless due to integer overflow caused by an unreasonably large input.
     */
    function pendingRedeemRequest(uint256 requestId, address controller)
        external
        view
        returns (uint256 pendingShares);

    /**
     * @dev Returns the amount of requested shares in Claimable state for the controller to redeem or withdraw.
     *
     * - MUST NOT include any shares in Pending state for redeem or withdraw.
     * - MUST NOT show any variations depending on the caller.
     * - MUST NOT revert unless due to integer overflow caused by an unreasonably large input.
     */
    function claimableRedeemRequest(uint256 requestId, address controller)
        external
        view
        returns (uint256 claimableShares);
}
