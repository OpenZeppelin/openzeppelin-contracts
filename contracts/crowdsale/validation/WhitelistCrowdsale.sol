pragma solidity ^0.5.0;
import "../Crowdsale.sol";
import "../../access/roles/WhitelistedRole.sol";


/**
 * @title WhitelistCrowdsale
 * @dev Crowdsale in which only whitelisted users can contribute.
 */
contract WhitelistCrowdsale is Initializable, WhitelistedRole, Crowdsale {
    function initialize(address sender) public initializer {
        WhitelistedRole.initialize(sender);

        assert(Crowdsale._hasBeenInitialized());
    }

    /**
    * @dev Extend parent behavior requiring beneficiary to be whitelisted. Note that no
    * restriction is imposed on the account sending the transaction.
    * @param _beneficiary Token beneficiary
    * @param _weiAmount Amount of wei contributed
    */
    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal view {
        require(isWhitelisted(_beneficiary));
        super._preValidatePurchase(_beneficiary, _weiAmount);
    }

    uint256[50] private ______gap;
}
