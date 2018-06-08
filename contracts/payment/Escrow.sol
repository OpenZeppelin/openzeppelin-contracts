pragma solidity ^0.4.23;

import "../math/SafeMath.sol";


/**
 * @title Escrow
 * @dev Base escrow contract, holds funds destinated to a payee until they
 * withdraw them.
 */
contract Escrow {
  using SafeMath for uint256;

  mapping(address => uint256) public deposits;

  /**
  * @dev Called by the payer to store the sent amount as credit to be pulled.
  * @param payee The destination address of the funds.
  */
  function deposit(address payee) payable public {
    uint256 amount = msg.value;
    require(amount > 0);

    deposits[payee] = deposits[payee].add(amount);
  }

  /**
  * @dev Withdraw accumulated balance for a payee. Any address can trigger a
  * withdrawal.
  * @param payee The address whose funds will be withdrawn and transferred to.
  */
  function withdraw(address payee) public {
    uint256 payment = deposits[payee];

    require(payment != 0);
    require(address(this).balance >= payment);

    deposits[payee] = 0;

    payee.transfer(payment);
  }
}
