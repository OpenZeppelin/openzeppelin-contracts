// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC7540} from "../../../interfaces/IERC7540.sol";
import {IERC20} from "../../../interfaces/IERC20.sol";
import {ERC4626} from "./ERC4626.sol";
import {SafeERC20} from "../utils/SafeERC20.sol";
import {Math} from "../../../utils/math/Math.sol";

/**
 * @dev Abstract implementation of the ERC-7540 standard, extending ERC-4626.
 */
abstract contract ERC7540 is ERC4626, IERC7540 {
    using SafeERC20 for IERC20;
    using Math for uint256;

    // Mappings to track pending and claimable requests
    mapping(address => mapping(uint256 => Request)) private _pendingDepositRequests;
    mapping(address => mapping(uint256 => Request)) private _pendingRedeemRequests;

    mapping(address => mapping(address => bool)) private _operators;

    /**
     * @dev Set the underlying asset contract.
     */
    constructor(IERC20 asset) ERC4626(asset) {}

    /**
     * @dev Creates a new deposit request.
     */
    function requestDeposit(
        uint256 assets,
        address controller,
        address owner
    ) external override returns (uint256 requestId) {
        require(assets > 0, "ERC7540: assets must be greater than zero");
        require(owner == msg.sender || isOperator(owner, msg.sender), "ERC7540: unauthorized");

        requestId = _generateRequestId(controller, assets);

        IERC20(asset()).safeTransferFrom(owner, address(this), assets);

        _pendingDepositRequests[controller][requestId].amount += assets;

        emit DepositRequest(controller, owner, requestId, msg.sender, assets);
    }

    /**
     * @dev Creates a new redeem request.
     */
    function requestRedeem(
        uint256 shares,
        address controller,
        address owner
    ) external override returns (uint256 requestId) {
        require(shares > 0, "ERC7540: shares must be greater than zero");
        require(owner == msg.sender || isOperator(owner, msg.sender), "ERC7540: unauthorized");

        requestId = _generateRequestId(controller, shares);

        _burn(owner, shares);

        _pendingRedeemRequests[controller][requestId].amount += shares;

        emit RedeemRequest(controller, owner, requestId, msg.sender, shares);
    }

    /**
     * @dev Gets the pending deposit request amount.
     */
    function pendingDepositRequest(uint256 requestId, address controller) external view override returns (uint256) {
        return _pendingDepositRequests[controller][requestId].amount;
    }

    /**
     * @dev Gets the pending redeem request amount.
     */
    function pendingRedeemRequest(uint256 requestId, address controller) external view override returns (uint256) {
        return _pendingRedeemRequests[controller][requestId].amount;
    }

    /**
     * @dev Gets the claimable deposit request amount.
     */
    function claimableDepositRequest(uint256 requestId, address controller) external view override returns (uint256) {
        return _pendingDepositRequests[controller][requestId].claimable;
    }

    /**
     * @dev Gets the claimable redeem request amount.
     */
    function claimableRedeemRequest(uint256 requestId, address controller) external view override returns (uint256) {
        return _pendingRedeemRequests[controller][requestId].claimable;
    }

    /**
     * @dev Sets or revokes an operator for the given controller.
     */
    function setOperator(address operator, bool approved) external override returns (bool) {
        _operators[msg.sender][operator] = approved;
        emit OperatorSet(msg.sender, operator, approved);
        return true;
    }

    /**
     * @dev Checks if an operator is approved for a controller.
     */
    function isOperator(address controller, address operator) public view override returns (bool) {
        return _operators[controller][operator];
    }

    /**
     * @dev Function to return pending deposit request.
     */
    function getPendingDepositRequest(address controller, uint256 requestId) public view returns (Request memory) {
        return _pendingDepositRequests[controller][requestId];
    }

    /**
     * @dev Function to return pending redeem request.
     */
    function getPendingRedeemRequest(address controller, uint256 requestId) public view returns (Request memory) {
        return _pendingRedeemRequests[controller][requestId];
    }

    /**
     * @dev Function to return operator.
     */
    function getOperator(address controller, address operator) public view returns (bool) {
        return _operators[controller][operator];
    }

    /**
     * @dev Internal function to generate a unique request ID.
     */
    function _generateRequestId(address controller, uint256 input) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao, msg.sender, controller, input)));
    }

    /**
     * @dev Abstract function for transitioning requests from Pending to Claimable.
     */
    function _processPendingRequests(uint256 requestId, address controller) internal virtual;
}
