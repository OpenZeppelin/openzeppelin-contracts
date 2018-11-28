pragma solidity ^0.4.24;
import "../Crowdsale.sol";
import "../../access/roles/WhitelisteeRole.sol";


/**
 * @title WhitelistedCrowdsale
 * @dev Crowdsale in which only whitelisted users can contribute.
 */
contract WhitelistedCrowdsale is WhitelisteeRole, Crowdsale {
    /**
    * @dev Extend parent behavior requiring beneficiary to be whitelisted.
    * @param _beneficiary Token beneficiary
    * @param _weiAmount Amount of wei contributed
    */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal view {
        require(isWhitelistee(_beneficiary));
        super._preValidatePurchase(_beneficiary, _weiAmount);
    }
}
