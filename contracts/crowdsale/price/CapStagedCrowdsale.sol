pragma solidity ^ 0.4.24;

import "../Crowdsale.sol";
import "../../math/SafeMath.sol";
import "../../ownership/Ownable.sol";


/**
  * @title CapStagedCrowdsale
  * @dev Extension of Crowdsale contract that changes the price of tokens regarding of raised ETH. Each stage of crowdsale is defined in StageLimit (cap limit for the stage) and stageRate (stage rate)
  * Stages must be inserted from first to last with increasing stageLimit.
  */
contract CapStagedCrowdsale is Crowdsale, Ownable {
  using SafeMath for uint256;

  struct Stage {
    uint256 limit;
    uint256 rate;
  }

  Stage[] public stages;

  /**
   * @dev Reverts if crowdsale started - weiRaised is more than 0
   */
  modifier beforeCrowdsaleStart() {
    require(weiRaised == 0);
    _;
  }

  /**
   * @param _rate Number of tokens a buyer gets per wei - default parameter for crowdsale contract
   * @param _wallet Address where funds should be transferred
   * @param _token ERC20 token address
   * @param _stageLimits Array of stage limits in wei
   * @param _stageRates Array of rates for every stage
   */
  constructor
  (
    uint256 _rate,
    address _wallet,
    ERC20 _token,
    uint256[] _stageLimits,
    uint256[] _stageRates
  )
    Crowdsale(_rate, _wallet, _token)
    public
  {
    require(_stageLimits.length == _stageRates.length);
    for (uint256 i = 0; i < _stageLimits.length; i++) {
      addStage(_stageLimits[i], _stageRates[i]);
    }
  }

  /**
    * @dev Function for adding stages. Stages must be inserted from first to last. Stages can only be added until weiRaised is 0
    * @param _limit - Stage limit in wei, _rate - stage rate
    */
  function addStage(uint256 _limit, uint256 _rate) internal beforeCrowdsaleStart {
    stages.push(Stage({
      limit: _limit,
      rate: _rate
    }));
  }

  /**
    * @dev Function for getting current rate of the stage.
    * @return uint256 Current rate of the stage
    */
  function getRate() public view returns(uint256) {
    bool isSet = false;
    if (stages.length > 0) {
      for (uint x = 0; x < stages.length; x++) {
        if (isSet == false) {
          if (stages[x].limit >= weiRaised) {
            isSet = true;
            return stages[x].rate;
          }
        }
      }
    } else {
      return rate;
      }
  }

  /**
    * @dev Overrides parent method taking into account variable rate.
    * @param _weiAmount The value in wei to be converted into tokens
    * @return The number of tokens _weiAmount wei will buy at present time
    */
  function _getTokenAmount(uint256 _weiAmount) internal view returns(uint256) {
    uint256 currentRate = getRate();
    return currentRate.mul(_weiAmount);
  }
}
