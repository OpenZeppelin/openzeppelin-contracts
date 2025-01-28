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
        address sender = _msgSender();

        if (assets == 0) {
            return 0;
        }

        if (owner != sender && !isOperator(owner, sender)) {
            revert ERC7540Unauthorized(sender, owner);
        }

        requestId = _generateRequestId(controller, assets);

        _pendingDepositRequests[controller][requestId].amount += assets;

        IERC20(asset()).safeTransferFrom(owner, address(this), assets);

        emit DepositRequest(controller, owner, requestId, sender, assets);
    }

    /**
     * @dev Creates a new redeem request.
     */
    function requestRedeem(
        uint256 shares,
        address controller,
        address owner
    ) external override returns (uint256 requestId) {
        address sender = _msgSender();
        if (shares == 0) {
            revert ERC7540ZeroSharesNotAllowed(sender, shares);
        }

        if (owner != sender && !isOperator(owner, sender)) {
            revert ERC7540Unauthorized(sender, owner);
        }

        requestId = _generateRequestId(controller, shares);

        _burn(owner, shares);

        _pendingRedeemRequests[controller][requestId].amount += shares;

        emit RedeemRequest(controller, owner, requestId, sender, shares);
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
        address sender = _msgSender();
        _operators[sender][operator] = approved;
        emit OperatorSet(sender, operator, approved);
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
     * @dev Internal function to generates a request ID. Requests created within the same block,
     * for the same controller, input, and sender, are cumulative.
     * 
     * Using only `block.number` ensures consistent behavior on L2s, where
     * `block.timestamp` might vary slightly between operators. This approach
     * defines "fungibility" of requests generated within the same block and
     * with identical parameters.
     */
    function _generateRequestId(address controller, uint256 input) internal virtual returns (uint256) {
        address sender = _msgSender();
        return uint256(keccak256(abi.encodePacked(block.number, sender, controller, input)));
    }

    /**
     * @dev Abstract function for transitioning requests from Pending to Claimable.
     */
    function _processPendingRequests(uint256 requestId, address controller) internal virtual;
}
