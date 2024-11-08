// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC4626.sol)

pragma solidity ^0.8.20;

import {BaseERC7540} from "./BaseERC7540.sol";
import {BaseERC7540Deposit} from "./ERC7540Deposit.sol";
import {BaseERC7540Redeem} from "./ERC7540Redeem.sol";
import {ERC4626} from "./ERC4626.sol";
import {ERC20, IERC20} from "../ERC20.sol";
import {IERC7540Deposit, IERC7540Redeem} from "../../../interfaces/IERC7540.sol";
import {SafeERC20} from "../utils/SafeERC20.sol";
import {Math} from "../../../utils/math/Math.sol";

/**
 * @dev Implementation of the {IERC7540Deposit} and {IERC7540Redeem} interfaces.
 *
 * This implementation is agnostic to the way deposit and redeem request fulfillments are integrated.
 * This means that a derived contract must implement {_fulfillDeposit} and {_fulfillRedeem}.
 */
contract ERC7540 is BaseERC7540Deposit, BaseERC7540Redeem {
    constructor(ERC20 _asset, string memory _name, string memory _symbol)
        BaseERC7540Deposit()
        BaseERC7540Redeem()
        BaseERC7540(_asset)
        ERC20(_name, _symbol)
    {}

    /**
     * @dev See {IERC4626-totalAssets}.
     */
    function totalAssets() public view virtual override(BaseERC7540Deposit, BaseERC7540) returns (uint256) {
        return totalAssets() - _totalPendingDepositAssets;
    }

    function maxDeposit(address controller)
        public
        view
        virtual
        override(BaseERC7540Deposit, ERC4626)
        returns (uint256)
    {
        return BaseERC7540Deposit.maxDeposit(controller);
    }

    function previewDeposit(uint256) public pure virtual override(BaseERC7540Deposit, ERC4626) returns (uint256) {
        revert("ERC7540Vault/async-flow");
    }

    function deposit(uint256 assets, address receiver)
        public
        virtual
        override(BaseERC7540Deposit, ERC4626)
        returns (uint256 shares)
    {
        shares = BaseERC7540Deposit.deposit(assets, receiver, receiver);
    }

    function maxMint(address controller) public view virtual override(BaseERC7540Deposit, ERC4626) returns (uint256) {
        return BaseERC7540Deposit.maxMint(controller);
    }

    function previewMint(uint256) public pure virtual override(BaseERC7540Deposit, ERC4626) returns (uint256) {
        revert("ERC7540Vault/async-flow");
    }

    function mint(uint256 shares, address receiver)
        public
        virtual
        override(BaseERC7540Deposit, ERC4626)
        returns (uint256 assets)
    {
        assets = BaseERC7540Deposit.mint(shares, receiver, receiver);
    }

    function maxWithdraw(address controller)
        public
        view
        virtual
        override(BaseERC7540Redeem, ERC4626)
        returns (uint256)
    {
        return BaseERC7540Redeem.maxWithdraw(controller);
    }

    function previewWithdraw(uint256) public pure virtual override(BaseERC7540Redeem, ERC4626) returns (uint256) {
        revert("ERC7540Vault/async-flow");
    }

    function withdraw(uint256 assets, address receiver, address controller)
        public
        virtual
        override(BaseERC7540Redeem, ERC4626)
        returns (uint256 shares)
    {
        shares = BaseERC7540Redeem.withdraw(assets, receiver, controller);
    }

    function maxRedeem(address controller) public view virtual override(BaseERC7540Redeem, ERC4626) returns (uint256) {
        return BaseERC7540Redeem.maxRedeem(controller);
    }

    function previewRedeem(uint256) public pure virtual override(BaseERC7540Redeem, ERC4626) returns (uint256) {
        revert("ERC7540Vault/async-flow");
    }

    function redeem(uint256 shares, address receiver, address controller)
        public
        virtual
        override(BaseERC7540Redeem, ERC4626)
        returns (uint256 assets)
    {
        assets = BaseERC7540Redeem.redeem(shares, receiver, controller);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        pure
        virtual
        override(BaseERC7540Deposit, BaseERC7540Redeem)
        returns (bool)
    {
        return interfaceId == type(IERC7540Deposit).interfaceId || interfaceId == type(IERC7540Redeem).interfaceId
            || super.supportsInterface(interfaceId);
    }
}
