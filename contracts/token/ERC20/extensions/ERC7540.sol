// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC4626} from "./ERC4626.sol";
import {IERC7540} from "../../../interfaces/IERC7540.sol";
import {SafeERC20} from "../utils/SafeERC20.sol";
import {IERC20} from "../../../interfaces/IERC20.sol";
import {Math} from "../../../utils/math/Math.sol";

/**
 * @dev Abstract implementation of the ERC-7540 standard, extending ERC-4626.
 */
abstract contract ERC7540 is ERC4626, IERC7540 {
    using SafeERC20 for IERC20;
    using Math for uint256;

    struct Request {
        uint256 amount;
        uint256 claimable;
    }

    // Mappings to track pending and claimable requests
    mapping(address => mapping(uint256 => Request)) private _pendingDepositRequests;

    mapping(address => mapping(address => bool)) private _operators;

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
     * @dev Gets the pending deposit request amount.
     */
    function pendingDepositRequest(uint256 requestId, address controller) external view override returns (uint256) {
        return _pendingDepositRequests[controller][requestId].amount;
    }

    /**
     * @dev Gets the claimable deposit request amount.
     */
    function claimableDepositRequest(uint256 requestId, address controller) external view override returns (uint256) {
        return _pendingDepositRequests[controller][requestId].claimable;
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
     * @dev Internal function to generate a unique request ID.
     */
    function _generateRequestId(address controller, uint256 input) internal view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, controller, input)));
    }

    /**
     * @dev Abstract function for transitioning requests from Pending to Claimable.
     */
    function _processPendingRequests(uint256 requestId, address controller) internal virtual;
}
