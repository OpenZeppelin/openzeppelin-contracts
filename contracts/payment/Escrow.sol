pragma solidity ^0.4.23;

import "../math/SafeMath.sol";


/**
 * @title Escrow
 * @dev Base escrow contract, holds funds destinated to a payee until they
 * withdraw them.
 */
contract Escrow {
  using SafeMath for uint256;

  mapping(address => uint256) private deposits;

  function depositsOf(address _payee) public view returns (uint256) {
    return deposits[_payee];
  }

  /**
  * @dev Called by the payer to store the sent amount as credit to be pulled.
  * @param _payee The destination address of the funds.
  */
  function deposit(address _payee) payable public {
    uint256 amount = msg.value;
    require(amount > 0);

    deposits[_payee] = deposits[_payee].add(amount);
  }

  /**
  * @dev Withdraw accumulated balance for a payee. Any address can trigger a
  * withdrawal.
  * @param _payee The address whose funds will be withdrawn and transferred to.
  */
  function withdraw(address _payee) public {
    uint256 payment = deposits[_payee];

    require(payment != 0);
    require(address(this).balance >= payment);

    deposits[_payee] = 0;

    _payee.transfer(payment);
  }
}
