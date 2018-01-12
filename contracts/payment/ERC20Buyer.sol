pragma solidity ^0.4.18;

import '../crowdsale/Crowdsale.sol';
import '../token/ERC20Basic.sol';
import './PullPayment.sol';


/**
 * @title ERC20Buyer
 * @dev Base contract allowing multiple user to partipate in a ERC20 Token Crowdsale done using OZ Crowdsale.sol in a single transaction.
 * Token will be distributed evenly between participants based on the number of Ether contributed
 * This will allow to reduce the network load in time of high congestion 
 * One of the possible extention to this contract would be to pay a bounty to the executer of the contract based on the total amount of ether contributed/number of token bought
 */
contract ERC20Buyer is PullPayment {

  Crowdsale public crowdsale;
  ERC20Basic public token;
  uint256 public rate;
  mapping (address => bool) public hasRedeemedToken;
  uint256 public executionTime;


  function ERC20Buyer(Crowdsale _crowdsale) public {
    require(address(_crowdsale) != address(0));
    crowdsale = _crowdsale;
    token = crowdsale.token();
    rate = crowdsale.rate();
    require(token != address(0));
    require(rate > 0);
  }

  function participate(address beneficiary) public payable {
    require(beneficiary != address(0));
    asyncSend(beneficiary, msg.value);
  }

  function execute() public {
    require(executionTime == 0);
    executionTime = now;
    crowdsale.buyTokens.value(totalPayments)(address(this));
    require(token.balanceOf(address(this)) == totalPayments.mul(rate)); //fill entirely or fail
  }

  function getTokens() public {
    require(executionTime != 0);
    require(payments[msg.sender] > 0);
    require(hasRedeemedToken[msg.sender] == false);
    hasRedeemedToken[msg.sender] = true;
    require(token.transfer(msg.sender, payments[msg.sender].mul(rate)));
  }
  // fallback function can be used to participate in crowdsale
  function () external payable {
    participate(msg.sender);
  }
}