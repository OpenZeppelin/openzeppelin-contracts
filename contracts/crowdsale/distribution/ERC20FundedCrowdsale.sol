pragma solidity ^0.4.24;

import "../Crowdsale.sol";
import "../../token/ERC20/IERC20.sol";
import "../../token/ERC20/SafeERC20.sol";
import "../../math/SafeMath.sol";

/**
 * @title ERC20FundedCrowdsale
 * @dev Crowdsale that raises funds in an ERC20 token (instead of Ether).
 * IMPORTANT: `weiRaised` indicates the number of `fundingToken`s raised (not Ether)
 *
 * Developed by blockimmo AG (https://blockimmo.ch/)
 */
contract ERC20FundedCrowdsale is Crowdsale {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 private _fundingToken;  // ERC20 token funds will be raised in

    /**
     * @param fundingToken IERC20 Address of the token funds will be raised in (i.e. Dai Stablecoin, Crypto Franc (XCHF), etc...).
     */
    constructor (IERC20 fundingToken) internal {
        require(fundingToken != address(0));
        _fundingToken = fundingToken;
    }

    /**
     * @return The token funds are being raised in.
     */
    function fundingToken() public view returns (IERC20) {
        return _fundingToken;
    }

    /**
     * @return The number of `fundingToken`s raised (NOT WEI).
     */
    function weiRaised() public view returns (uint256) {
        return fundingToken().balanceOf(address(this));
    }

    /**
     * @dev Validates the incoming purchase by ensuring no wei is sent with the transaction, and number of `fundingToken`s
     * sent with the transaction is greater than 0.
     * @param beneficiary Address that will receive `token`s from this purchase
     * @param weiAmount Guaranteed to be 0
     */
    function _preValidatePurchase(address beneficiary, uint256 weiAmount) internal view {
        require(beneficiary != address(0));
        require(weiAmount == 0);

        require(fundingToken().allowance(msg.sender, address(this)) > 0);
    }

    /**
     * @dev Convert number of `fundingToken`s to number of `token`s.
     * @param weiAmount Guaranteed to be 0
     * @return Number of `token`s that will be received from this purchase
     */
    function _getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
        return fundingToken().allowance(msg.sender, address(this)).mul(rate());
    }

    /**
     * @dev Forwards `fundingToken`s to `wallet`.
     */
    function _forwardFunds() internal {
        uint256 allowance = fundingToken().allowance(msg.sender, address(this));
        fundingToken().safeTransferFrom(msg.sender, wallet(), allowance);
    }

}
