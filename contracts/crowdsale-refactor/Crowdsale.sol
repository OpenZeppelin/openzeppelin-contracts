pragma solidity ^0.4.18;

import "../token/ERC20/MintableToken.sol";
import "../math/SafeMath.sol";

contract Crowdsale {
  using SafeMath for uint256;

  ERC20 public token;

  uint256 public startTime;
  uint256 public endTime;

  address public wallet;
  uint256 public rate;
  uint256 public weiRaised;

  event TokenPurchase(address indexed purchaser, address indexed beneficiary, uint256 value, uint256 amount);

  function Crowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, ERC20 _token) public {
    require(_startTime >= now);
    require(_endTime >= _startTime);
    require(_rate > 0);
    require(_wallet != address(0));
    require(_token != address(0));

    startTime = _startTime;
    endTime = _endTime;
    rate = _rate;
    wallet = _wallet;
    token = _token;
  }

  // -----------------------------------------
  // Crowdsale external interface
  // -----------------------------------------

  function () external payable {
    buyTokens(msg.sender);
  }

  function buyTokens(address beneficiary) public payable {

    uint256 weiAmount = msg.value;
    preValidatePurchase(beneficiary, weiAmount);

    // calculate token amount to be created
    uint256 tokens = getTokenAmount(weiAmount);

    // update state
    weiRaised = weiRaised.add(weiAmount);

    processPurchase(beneficiary, tokens);
    TokenPurchase(msg.sender, beneficiary, weiAmount, tokens);

    forwardFunds();
    postValidatePurchase(beneficiary, weiAmount);
  }

  function hasEnded() public view returns (bool) {
    return now > endTime;
  }

  // -----------------------------------------
  // Purchase validation
  // -----------------------------------------

  function preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal {
    require(_beneficiary != address(0));
    require(now >= startTime && now <= endTime);
    require(_weiAmount != 0);
  }

  function postValidatePurchase(address beneficiary, uint256 weiAmount) internal {
    // optional override
  }
  
  // -----------------------------------------
  // Emission
  // -----------------------------------------

  function emitTokens(address _beneficiary, uint256 _tokenAmount) internal {
    token.transfer(_beneficiary, _tokenAmount);
  }

  // -----------------------------------------
  // Token distribution
  // -----------------------------------------

  function processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    emitTokens(_beneficiary, _tokenAmount);
  }

  // -----------------------------------------
  // Price calculation
  // -----------------------------------------

  function getTokenAmount(uint256 weiAmount) internal view returns (uint256) {
    return weiAmount.mul(rate);
  }

  // -----------------------------------------
  // Funds distribution
  // -----------------------------------------

  function forwardFunds() internal {
    wallet.transfer(msg.value);
  }
}
