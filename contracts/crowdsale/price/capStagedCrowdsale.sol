pragma solidity ^ 0.4 .23;

import "../Crowdsale.sol";
import "../../math/SafeMath.sol";
import "../../ownership/Ownable.sol";

/**
 * @title CapStagedCrowdsale
 * @dev Extension of Crowdsale contract that changes the price of tokens regarding of raised ETH. Each stage of crowdsale is defined in StageLimit (cap limit for the stage) and stageRate (stage rate)
 * Stages must be inserted from first to last with increasing stageLimit.
 */
contract CapStagedCrowdsale is Crowdsale, Ownable {
    using SafeMath
    for uint256;
    using SafeMath
    for uint;

    struct Stage {
        uint256 stageLimit;
        uint256 stageRate;
    }

    Stage[] public stages;

    /**
     * @dev Function for adding stages. Stages must be inserted from first to last
     * @param stLimit - Stage limit in wei, stRate - rate of tokens for the stage
     */
    function addStage(uint256 stLimit, uint256 stRate) public onlyOwner {
        Stage memory stage = Stage(stLimit, stRate);
        stages.push(stage);
    }

    /**
     * @dev Function for getting current rate of the stage.
     * @return uint256 Current rate of the stage
     */
    function getRate() public view returns(uint256) {
        bool isSet = false;
        for (uint x = 0; x < stages.length; x++) {
            if (isSet == false) {
                if (stages[x].stageLimit >= weiRaised) {
                    isSet = true;
                    return stages[x].stageRate;
                }
            }
        }
        if (isSet == false) {
            return rate; //return initial rate if any of the stages limit does not match
        }
    }
    /**
     * @dev Overrides parent method taking into account variable rate.
     * @param _weiAmount The value in wei to be converted into tokens
     * @return The number of tokens _weiAmount wei will buy at present time
     */
    function _getTokenAmount(uint256 _weiAmount)
    internal view returns(uint256) {
        require(stages[(stages.length).sub(1)].stageLimit > weiRaised); //make sure that weiRaised is not bigger than last stage limit
        uint256 currentRate = getRate();
        return currentRate.mul(_weiAmount);
    }

}
