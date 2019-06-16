pragma solidity ^0.5.0;

import "../../math/SafeMath.sol";
import "./CappedCrowdsale.sol";

/**
 * @title OverPurchaseCrowdsale
 * @dev Crowdsale with a refund over the purchasable amount.
 */
contract OverPurchaseCrowdsale is CappedCrowdsale {
    using SafeMath for uint256;

    /**
     * @dev Update of an incoming purchasing amount.
     * @param beneficiary Address performing the token purchase
     * @param weiAmount Value in wei involved in the purchase
     */
    function _updatePurchasingAmount(address beneficiary, uint256 weiAmount) internal returns (uint256) {
        uint amount = super._updatePurchasingAmount(beneficiary, weiAmount);

        if (weiRaised().add(amount) > cap()) {
            amount = cap().sub(weiRaised());
        }

        uint reufndAmount = weiAmount.sub(amount);
        if (reufndAmount > 0) {
            // buyTokens function is safe for reenterancy attack, so we can transfer here.
            msg.sender.transfer(reufndAmount);
        }

        return amount;
    }
}
