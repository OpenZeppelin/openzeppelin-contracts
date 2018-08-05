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
  using SafeMath for uint;
  bool isActive = false;

  struct Stage {
    uint256 stageLimit;
    uint256 stageRate;
  }

  Stage[] public stages;

  /**
   * @dev Reverts if crowdsale started - weiRaised is more than 0 or isActive is set to 1 with setCrowdsaleState function
   */
  modifier crowdsaleStarted() {
    require((weiRaised == 0) && (isActive == false));
    _;
  }

  /**
   * @dev Constructor, takes iniital rate, wallet for funds, token address, array od stage limits in wei and stage rates
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
    for (uint256 i = 0; i < _stageLimits.length; i++) {
      addStage(_stageLimits[i], _stageRates[i]);
    }
  }

  /**
    * @dev Function for adding stages. Stages must be inserted from first to last. Stages can only be added until weiRaised is 0
    * @param _stLimit - Stage limit in wei, _stRate - stage rate
    */
  function addStage(uint256 _stLimit, uint256 _stRate) onlyOwner crowdsaleStarted public {
    Stage memory stage = Stage(_stLimit, _stRate);
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
  }

  function setCrowdsaleState(bool _state) onlyOwner crowdsaleStarted public {
    isActive = _state;
  }

  /**
    * @dev Overrides parent method taking into account variable rate.
    * @param _weiAmount The value in wei to be converted into tokens
    * @return The number of tokens _weiAmount wei will buy at present time
    */
  function _getTokenAmount(uint256 _weiAmount) internal view returns(uint256) {
    require(stages[(stages.length).sub(1)].stageLimit > weiRaised);
    uint256 currentRate = getRate();
    return currentRate.mul(_weiAmount);
  }
}
