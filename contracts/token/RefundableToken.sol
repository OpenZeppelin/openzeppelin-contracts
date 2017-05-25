pragma solidity ^0.4.8;


import './StandardToken.sol';
import '../ownership/Ownable.sol';
import '../SafeMath.sol';


/**
 * @title Refundable token
 * 
 * @dev Simple ERC20 Token example, with refundable token creation.
 * @dev Issue: https://github.com/OpenZeppelin/zeppelin-solidity/issues/217
 *
 * @notice Your main contract should inherit form this contract and implement the canRefund() method.
 * @notice Warning -> If you do not implement canRefund() this will be an abstract contract.
*/


contract RefundableToken is StandardToken, Ownable {
  event Refund(address indexed to, uint amount);

  uint public refundRate = 100;

  /**
   * @dev Abstract function meant to be defined be token user.
   * @return A boolean that indicates if the the token is currently refundable.
   */

  function canRefund() internal returns (bool);

  /**
   * @dev Function to set the refundRate of tokens to Ether.
   * @param _newRefundRate Uint that updates the current refundRate.
   */

  function setRefundRate(uint _newRefundRate) onlyOwner {
    refundRate = _newRefundRate;
  }

  /**
   * @dev Function that allows users to refund tokens for Ether if canRefund returns True, they have enough tokens, and the contract has enough Ether.
   * @param _amount Uint that is the amount of tokens the user wants to refund.
   */

  function refund(uint _amount) {
    if (!canRefund() || _amount == 0) {
      throw;
    }

    address _refundee = msg.sender;

    if(balances[_refundee] < _amount) {
      throw;
    }

    uint refund = _amount * (refundRate/100);

    if (this.balance < refund) {
      throw;
    }

    if (!_refundee.send(refund)) {
      throw;
    }

    balances[_refundee] = balances[_refundee].sub(_amount);
    Refund(_refundee, refund);
  }
}
