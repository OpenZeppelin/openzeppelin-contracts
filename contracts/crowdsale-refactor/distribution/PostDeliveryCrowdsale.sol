pragma solidity ^0.4.18;

import "../CrowdsaleBase.sol";
import "../../token/ERC20/ERC20.sol";

contract PostDeliveryCrowdsale is CrowdsaleBase {
  
  mapping(address => uint256) promised;

  function processPurchase(address _beneficiary, uint256 _tokenAmount) internal {
    promises[_beneficiary] = promises[_beneficiary].add(_tokenAmount);
  }

  function withdrawTokens() public {
    require(hasEnded());
    uint256 amount = promises[msg.sender];
    require(amount > 0);
    promises[msg.sender] = 0;
    emitTokens(msg.sender, amount);
  }
}
