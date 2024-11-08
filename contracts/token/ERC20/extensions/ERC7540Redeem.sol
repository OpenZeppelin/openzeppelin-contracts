// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC4626.sol)

pragma solidity ^0.8.20;

import {BaseERC7540} from "./BaseERC7540.sol";
import {ERC20, IERC20} from "../ERC20.sol";
import {IERC7540Redeem} from "../../../interfaces/IERC7540.sol";
import {SafeERC20} from "../utils/SafeERC20.sol";
import {Math} from "../../../utils/math/Math.sol";

/**
 * @dev Implementation of the {IERC7540Redeem} interface.
 *
 * This implementation is agnostic to the way redeem request fulfillments are integrated.
 * This means that a derived contract must implement {_fulfillRedeem}.
 */
abstract contract BaseERC7540Redeem is BaseERC7540, IERC7540Redeem {
    using Math for uint256;

    mapping(address => PendingRedeem) internal _pendingRedeem;
    mapping(address => ClaimableRedeem) internal _claimableRedeem;

    struct PendingRedeem {
        uint256 shares;
    }

    struct ClaimableRedeem {
        uint256 assets;
        uint256 shares;
    }

    /**
     * @dev See {IERC7540Redeem-requestRedeem}.
     */
    function requestRedeem(uint256 shares, address controller, address owner)
        external
        virtual
        returns (uint256 requestId)
    {
        require(owner == msg.sender || isOperator[owner][msg.sender], "ERC7540Vault/invalid-owner");
        require(ERC20(address(this)).balanceOf(owner) >= shares, "ERC7540Vault/insufficient-balance");
        require(shares != 0, "ZERO_SHARES");

        SafeERC20.safeTransferFrom(this, owner, address(this), shares);

        uint256 currentPendingShares = _pendingRedeem[controller].shares;
        _pendingRedeem[controller] = PendingRedeem(shares + currentPendingShares);

        emit RedeemRequest(controller, owner, REQUEST_ID, msg.sender, shares);
        return REQUEST_ID;
    }

    /**
     * @dev See {IERC7540Redeem-pendingRedeemRequest}.
     */
    function pendingRedeemRequest(uint256, address controller) public view virtual returns (uint256 pendingAssets) {
        pendingAssets = _pendingRedeem[controller].shares;
    }

    /**
     * @dev See {IERC7540Redeem-claimableRedeemRequest}.
     */
    function claimableRedeemRequest(uint256, address controller)
        public
        view
        virtual
        returns (uint256 claimableAssets)
    {
        claimableAssets = _claimableRedeem[controller].shares;
    }

    /**
     * @dev TODO
     */
    function _fulfillRedeem(address controller, uint256 assets) internal returns (uint256 shares) {
        PendingRedeem storage request = _pendingRedeem[controller];
        require(request.shares != 0 && shares <= request.shares, "ZERO_SHARES");

        assets = convertToAssets(shares);

        _claimableRedeem[controller] =
            ClaimableRedeem(_claimableRedeem[controller].assets + assets, _claimableRedeem[controller].shares + shares);

        request.shares -= shares;
    }

    /**
     * @dev See {IERC4626-withdraw}.
     */
    function withdraw(uint256 assets, address receiver, address controller)
        public
        virtual
        override
        returns (uint256 shares)
    {
        require(controller == msg.sender || isOperator[controller][msg.sender], "ERC7540Vault/invalid-caller");
        require(assets != 0, "Must claim nonzero amount");

        // Claiming partially introduces precision loss. The user therefore receives a rounded down amount,
        // while the claimable balance is reduced by a rounded up amount.
        ClaimableRedeem storage claimable = _claimableRedeem[controller];
        shares = assets.mulDiv(claimable.shares, claimable.assets, Math.Rounding.Floor);
        uint256 sharesUp = assets.mulDiv(claimable.shares, claimable.assets, Math.Rounding.Ceil);

        claimable.assets -= assets;
        claimable.shares = claimable.shares > sharesUp ? claimable.shares - sharesUp : 0;

        SafeERC20.safeTransfer(_asset, receiver, assets);

        emit Withdraw(msg.sender, receiver, controller, assets, shares);
    }

    /**
     * @dev See {IERC4626-redeem}.
     */
    function redeem(uint256 shares, address receiver, address controller)
        public
        virtual
        override
        returns (uint256 assets)
    {
        require(controller == msg.sender || isOperator[controller][msg.sender], "ERC7540Vault/invalid-caller");
        require(shares != 0, "Must claim nonzero amount");

        // Claiming partially introduces precision loss. The user therefore receives a rounded down amount,
        // while the claimable balance is reduced by a rounded up amount.
        ClaimableRedeem storage claimable = _claimableRedeem[controller];
        assets = shares.mulDiv(claimable.assets, claimable.shares, Math.Rounding.Floor);
        uint256 assetsUp = shares.mulDiv(claimable.assets, claimable.shares, Math.Rounding.Ceil);

        claimable.assets = claimable.assets > assetsUp ? claimable.assets - assetsUp : 0;
        claimable.shares -= shares;

        SafeERC20.safeTransfer(_asset, receiver, assets);

        emit Withdraw(msg.sender, receiver, controller, assets, shares);
    }

    /**
     * @dev See {IERC4626-maxWithdraw}.
     */
    function maxWithdraw(address controller) public view virtual override returns (uint256) {
        return _claimableRedeem[controller].assets;
    }

    /**
     * @dev See {IERC4626-maxRedeem}.
     */
    function maxRedeem(address controller) public view virtual override returns (uint256) {
        return _claimableRedeem[controller].shares;
    }

    /**
     * @dev See {IERC4626-previewWithdraw}.
     */
    function previewWithdraw(uint256) public pure virtual override returns (uint256) {
        revert("async-flow");
    }

    /**
     * @dev See {IERC4626-previewRedeem}.
     */
    function previewRedeem(uint256) public pure virtual override returns (uint256) {
        revert("async-flow");
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public pure virtual override returns (bool) {
        return interfaceId == type(IERC7540Redeem).interfaceId || super.supportsInterface(interfaceId);
    }
}

contract ERC7540Redeem is BaseERC7540Redeem {
    constructor(ERC20 _asset, string memory _name, string memory _symbol) BaseERC7540(_asset) ERC20(_name, _symbol) {}
}
