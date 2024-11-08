// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC4626.sol)

pragma solidity ^0.8.20;

import {BaseERC7540} from "./BaseERC7540.sol";
import {ERC20, IERC20} from "../ERC20.sol";
import {IERC7540Deposit} from "../../../interfaces/IERC7540.sol";
import {SafeERC20} from "../utils/SafeERC20.sol";
import {Math} from "../../../utils/math/Math.sol";

/**
 * @dev Implementation of the {IERC7540Deposit} interface.
 *
 * This implementation is agnostic to the way deposit request fulfillments are integrated.
 * This means that a derived contract must implement {_fulfillDeposit}.
 */
abstract contract BaseERC7540Deposit is BaseERC7540, IERC7540Deposit {
    using Math for uint256;

    uint256 internal _totalPendingDepositAssets;
    mapping(address => PendingDeposit) internal _pendingDeposit;
    mapping(address => ClaimableDeposit) internal _claimableDeposit;

    struct PendingDeposit {
        uint256 assets;
    }

    struct ClaimableDeposit {
        uint256 assets;
        uint256 shares;
    }

    /**
     * @dev See {IERC4626-totalAssets}.
     */
    function totalAssets() public view virtual override returns (uint256) {
        // Total assets pending redemption must be removed from the reported total assets
        // otherwise pending assets would be treated as yield for outstanding shares
        return totalAssets() - _totalPendingDepositAssets;
    }

    /**
     * @dev See {IERC7540Deposit-requestDeposit}.
     */
    function requestDeposit(uint256 assets, address controller, address owner)
        external
        virtual
        returns (uint256 requestId)
    {
        require(owner == msg.sender || isOperator[owner][msg.sender], "ERC7540Vault/invalid-owner");
        require(_asset.balanceOf(owner) >= assets, "ERC7540Vault/insufficient-balance");
        require(assets != 0, "ZERO_ASSETS");

        SafeERC20.safeTransferFrom(_asset, owner, address(this), assets);

        uint256 currentPendingAssets = _pendingDeposit[controller].assets;
        _pendingDeposit[controller] = PendingDeposit(assets + currentPendingAssets);

        _totalPendingDepositAssets += assets;

        emit DepositRequest(controller, owner, REQUEST_ID, msg.sender, assets);
        return REQUEST_ID;
    }

    /**
     * @dev See {IERC7540Deposit-pendingDepositRequest}.
     */
    function pendingDepositRequest(uint256, address controller) public view virtual returns (uint256 pendingAssets) {
        pendingAssets = _pendingDeposit[controller].assets;
    }

    /**
     * @dev See {IERC7540Deposit-claimableDepositRequest}.
     */
    function claimableDepositRequest(uint256, address controller)
        public
        view
        virtual
        returns (uint256 claimableAssets)
    {
        claimableAssets = _claimableDeposit[controller].assets;
    }

    /**
     * @dev TODO
     */
    function _fulfillDeposit(address controller, uint256 assets) internal returns (uint256 shares) {
        PendingDeposit storage request = _pendingDeposit[controller];
        require(request.assets != 0 && assets <= request.assets, "ZERO_ASSETS");

        shares = convertToShares(assets);
        _mint(address(this), shares);

        _claimableDeposit[controller] = ClaimableDeposit(
            _claimableDeposit[controller].assets + assets, _claimableDeposit[controller].shares + shares
        );

        request.assets -= assets;
        _totalPendingDepositAssets -= assets;
    }

    /**
     * @dev See {IERC7540Deposit-deposit}.
     */
    function deposit(uint256 assets, address receiver, address controller) public virtual returns (uint256 shares) {
        require(controller == msg.sender || isOperator[controller][msg.sender], "ERC7540Vault/invalid-caller");
        require(assets != 0, "Must claim nonzero amount");

        // Claiming partially introduces precision loss. The user therefore receives a rounded down amount,
        // while the claimable balance is reduced by a rounded up amount.
        ClaimableDeposit storage claimable = _claimableDeposit[controller];
        shares = assets.mulDiv(claimable.shares, claimable.assets, Math.Rounding.Floor);
        uint256 sharesUp = assets.mulDiv(claimable.shares, claimable.assets, Math.Rounding.Ceil);

        claimable.assets -= assets;
        claimable.shares = claimable.shares > sharesUp ? claimable.shares - sharesUp : 0;

        ERC20(address(this)).transfer(receiver, shares);

        emit Deposit(receiver, controller, assets, shares);
    }

    /**
     * @dev See {IERC7540Deposit-mint}.
     */
    function mint(uint256 shares, address receiver, address controller)
        public
        virtual
        override
        returns (uint256 assets)
    {
        require(controller == msg.sender || isOperator[controller][msg.sender], "ERC7540Vault/invalid-caller");
        require(shares != 0, "Must claim nonzero amount");

        // Claiming partially introduces precision loss. The user therefore receives a rounded down amount,
        // while the claimable balance is reduced by a rounded up amount.
        ClaimableDeposit storage claimable = _claimableDeposit[controller];
        assets = shares.mulDiv(claimable.assets, claimable.shares, Math.Rounding.Floor);
        uint256 assetsUp = shares.mulDiv(claimable.assets, claimable.shares, Math.Rounding.Ceil);

        claimable.assets = claimable.assets > assetsUp ? claimable.assets - assetsUp : 0;
        claimable.shares -= shares;

        ERC20(address(this)).transfer(receiver, shares);

        emit Deposit(receiver, controller, assets, shares);
    }

    /**
     * @dev See {IERC4626-deposit}.
     */
    function deposit(uint256 assets, address receiver) public virtual override returns (uint256 shares) {
        shares = deposit(assets, receiver, receiver);
    }

    /**
     * @dev See {IERC4626-mint}.
     */
    function mint(uint256 shares, address receiver) public virtual override returns (uint256 assets) {
        assets = mint(shares, receiver, receiver);
    }

    /**
     * @dev See {IERC4626-maxDeposit}.
     */
    function maxDeposit(address controller) public view virtual override returns (uint256) {
        return _claimableDeposit[controller].assets;
    }

    /**
     * @dev See {IERC4626-maxMint}.
     */
    function maxMint(address controller) public view virtual override returns (uint256) {
        return _claimableDeposit[controller].shares;
    }

    /**
     * @dev See {IERC4626-previewDeposit}.
     */
    function previewDeposit(uint256) public pure virtual override returns (uint256) {
        revert("async-flow");
    }

    /**
     * @dev See {IERC4626-previewMint}.
     */
    function previewMint(uint256) public pure virtual override returns (uint256) {
        revert("async-flow");
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public pure virtual override returns (bool) {
        return interfaceId == type(IERC7540Deposit).interfaceId || super.supportsInterface(interfaceId);
    }
}

contract ERC7540Deposit is BaseERC7540Deposit {
    constructor(ERC20 _asset, string memory _name, string memory _symbol) BaseERC7540(_asset) ERC20(_name, _symbol) {}
}
