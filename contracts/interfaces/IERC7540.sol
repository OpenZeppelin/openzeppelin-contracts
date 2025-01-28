// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC4626} from "../interfaces/IERC4626.sol";

/**
 * @dev Interface for the ERC-7540 Asynchronous Tokenized Vaults standard.
 * https://eips.ethereum.org/EIPS/eip-7540[ERC-7540]
 */
interface IERC7540 is IERC4626 {
    struct Request {
        uint256 amount;
        uint256 claimable;
    }

    // Events
    event DepositRequest(
        address indexed controller,
        address indexed owner,
        uint256 indexed requestId,
        address sender,
        uint256 assets
    );

    event RedeemRequest(
        address indexed controller,
        address indexed owner,
        uint256 indexed requestId,
        address sender,
        uint256 shares
    );

    event OperatorSet(address indexed controller, address indexed operator, bool approved);

    event DepositProcessed(address indexed controller, uint256 indexed requestId, uint256 amount);

    event RedeemProcessed(address indexed controller, uint256 indexed requestId, uint256 amount);

    // Methods

    /**
     * @dev Initiates a deposit request.
     * @param assets The amount of assets to deposit.
     * @param controller The address of the controller managing the request.
     * @param owner The owner of the assets.
     * @return requestId The unique identifier for this deposit request.
     */
    function requestDeposit(uint256 assets, address controller, address owner) external returns (uint256 requestId);

    /**
     * @dev Initiates a redeem request.
     * @param shares The amount of shares to redeem.
     * @param controller The address of the controller managing the request.
     * @param owner The owner of the shares.
     * @return requestId The unique identifier for this redeem request.
     */
    function requestRedeem(uint256 shares, address controller, address owner) external returns (uint256 requestId);

    /**
     * @dev Gets the pending deposit request amount for a given controller and requestId.
     * @param requestId The unique identifier for the request.
     * @param controller The address of the controller.
     * @return assets The amount of assets in the pending state.
     */
    function pendingDepositRequest(uint256 requestId, address controller) external view returns (uint256 assets);

    /**
     * @dev Gets the pending redeem request amount for a given controller and requestId.
     * @param requestId The unique identifier for the request.
     * @param controller The address of the controller.
     * @return shares The amount of shares in the pending state.
     */
    function pendingRedeemRequest(uint256 requestId, address controller) external view returns (uint256 shares);

    /**
     * @dev Gets the claimable deposit request amount for a given controller and requestId.
     * @param requestId The unique identifier for the request.
     * @param controller The address of the controller.
     * @return assets The amount of assets in the claimable state.
     */
    function claimableDepositRequest(uint256 requestId, address controller) external view returns (uint256 assets);

    /**
     * @dev Gets the claimable redeem request amount for a given controller and requestId.
     * @param requestId The unique identifier for the request.
     * @param controller The address of the controller.
     * @return shares The amount of shares in the claimable state.
     */
    function claimableRedeemRequest(uint256 requestId, address controller) external view returns (uint256 shares);

    /**
     * @dev Sets or revokes an operator for the given controller.
     * @param operator The address of the operator.
     * @param approved The approval status of the operator.
     * @return success Whether the operation was successful.
     */
    function setOperator(address operator, bool approved) external returns (bool success);

    /**
     * @dev Checks if an operator is approved for a controller.
     * @param controller The address of the controller.
     * @param operator The address of the operator.
     * @return status Whether the operator is approved.
     */
    function isOperator(address controller, address operator) external view returns (bool status);

    /**
     * @dev Gets the details of a pending deposit request.
     * @param controller The address of the controller.
     * @param requestId The unique identifier for the deposit request.
     * @return request The request object containing amount and claimable details.
     */
    function getPendingDepositRequest(
        address controller,
        uint256 requestId
    ) external view returns (Request memory request);

    /**
     * @dev Gets the details of a pending redeem request.
     * @param controller The address of the controller.
     * @param requestId The unique identifier for the redeem request.
     * @return request The request object containing amount and claimable details.
     */
    function getPendingRedeemRequest(
        address controller,
        uint256 requestId
    ) external view returns (Request memory request);

    /**
     * @dev Gets the status of an operator for a given controller.
     * @param controller The address of the controller.
     * @param operator The address of the operator.
     * @return status Whether the operator is approved.
     */
    function getOperator(address controller, address operator) external view returns (bool status);
}
