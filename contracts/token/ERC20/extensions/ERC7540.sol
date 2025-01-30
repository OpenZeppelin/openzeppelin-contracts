// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {IERC7540} from "../../../interfaces/IERC7540.sol";
import {IERC4626} from "../../../interfaces/IERC4626.sol";
import {IERC20} from "../../../interfaces/IERC20.sol";
import {ERC4626} from "./ERC4626.sol";
import {IERC165} from "../../../interfaces/IERC165.sol";
import {SafeERC20} from "../utils/SafeERC20.sol";
import {Math} from "../../../utils/math/Math.sol";

/**
 * @dev Abstract implementation of the ERC-7540 standard, extending ERC-4626.
 */
abstract contract ERC7540 is ERC4626, IERC7540, IERC165 {
    using SafeERC20 for IERC20;
    using Math for uint256;

    uint256 public constant VESTING_DURATION = 48 hours;

    // Mappings to track pending and claimable requests
    mapping(address => mapping(uint256 => Request)) private _pendingDepositRequests;
    mapping(address => mapping(uint256 => Request)) private _pendingRedeemRequests;
    mapping(address => mapping(address => bool)) private _operators;
    mapping(uint256 => uint256) private _vestingTimestamps;

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
    ) public virtual override returns (uint256 requestId) {
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
    ) public virtual override returns (uint256 requestId) {
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

        // Set vesting unlock time
        _vestingTimestamps[requestId] = block.timestamp + VESTING_DURATION;

        emit RedeemRequest(controller, owner, requestId, sender, shares);
    }

    /*
     * @dev Overrides maxDeposit to allow deposits up to claimable request amount
     */
    function maxDeposit(address controller) public view virtual override(ERC4626, IERC4626) returns (uint256) {
        return _pendingDepositRequests[controller][0].claimable;
    }

    /*
     * @dev Overrides maxRedeem to allow redemptions up to claimable request amount
     */
    function maxRedeem(address controller) public view virtual override(ERC4626, IERC4626) returns (uint256) {
        return _pendingRedeemRequests[controller][0].claimable;
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
     * @dev Implements ERC-7540 deposit by allowing users to deposit through calling ERC4626 deposit.
     */
    function deposit(uint256 assets, address receiver, address controller) public virtual returns (uint256 shares) {
        address sender = _msgSender();

        if (sender != controller && !isOperator(controller, sender)) {
            revert ERC7540Unauthorized(sender, controller);
        }

        Request storage request = _pendingDepositRequests[controller][0];
        if (request.claimable < assets) {
            revert ERC7540InsufficientClaimable(assets, request.claimable);
        }

        request.claimable -= assets;

        uint256 maxAssets = maxDeposit(receiver);
        if (assets > maxAssets) {
            revert ERC4626ExceededMaxDeposit(receiver, assets, maxAssets);
        }
        
        shares = super.deposit(assets, receiver);
        
        return shares;
    }

    /**
     * @dev Implements ERC-7540 claim by allowing users to redeem claimable shares.
     */
    function redeem(uint256 shares, address receiver, address controller) public virtual override(ERC4626, IERC4626) returns (uint256 assets) {
        address sender = _msgSender();
        if (sender != controller && !isOperator(controller, sender)) {
            revert ERC7540Unauthorized(sender, controller);
        }

        Request storage request = _pendingRedeemRequests[controller][0];
        if (request.claimable < shares) {
            revert ERC7540InsufficientClaimable(shares, request.claimable);
        }

        request.claimable -= shares;

        uint256 maxShares = maxRedeem(controller);
        if (shares > maxShares) {
            revert ERC4626ExceededMaxRedeem(controller, shares, maxShares);
        }
        
        assets = super.redeem(shares, receiver, controller);
        
        return assets;
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

    function previewDeposit(uint256) public view virtual override(ERC4626, IERC4626) returns (uint256) {
        revert("ERC7540: previewDeposit not supported");
    }

    function previewMint(uint256) public view virtual override(ERC4626, IERC4626) returns (uint256) {
        revert("ERC7540: previewMint not supported");
    }

    function previewRedeem(uint256) public view virtual override(ERC4626, IERC4626) returns (uint256) {
        revert("ERC7540: previewRedeem not supported");
    }

    function previewWithdraw(uint256) public view virtual override(ERC4626, IERC4626) returns (uint256) {
        revert("ERC7540: previewWithdraw not supported");
    }

    /**
     * @dev Implements ERC-165 interface detection.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == 0xe3bc4e65 || // ERC-7540 operator methods
            interfaceId == 0x2f0a18c5 || // ERC-7575 interface
            interfaceId == 0xce3bbe50 || // Asynchronous deposit Vault
            interfaceId == 0x620ee8e4; // Asynchronous redemption Vault
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
    function _processPendingRequests(uint256 requestId, address controller) internal virtual {
        Request storage depositRequest = _pendingDepositRequests[controller][requestId];
        if (depositRequest.amount > 0) {
            depositRequest.claimable += depositRequest.amount;
            depositRequest.amount = 0;
        }

        Request storage redeemRequest = _pendingRedeemRequests[controller][requestId];
        if (redeemRequest.amount > 0) {
            redeemRequest.claimable += redeemRequest.amount;
            redeemRequest.amount = 0;
        }
    }
}
