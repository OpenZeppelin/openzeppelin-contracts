pragma solidity ^0.4.23;

import "./ConditionalEscrow.sol";
import "../ownership/Ownable.sol";


/**
 * @title RefundableEscrow
 * @dev Escrow that holds investor funds for a unique benefitiary, and allows for
 * either withdrawal by the benefiatiary, or refunds to the investors.
 */
contract RefundableEscrow is ConditionalEscrow, Ownable {
  enum State { Active, Refunding, Closed }

  event Closed();
  event RefundsEnabled();

  State public state;
  address public beneficiary;

  constructor(address _beneficiary) public {
    require(_beneficiary != address(0));
    beneficiary = _beneficiary;
    state = State.Active;
  }

  function invest() payable public {
    require(state == State.Active);
    super.deposit(msg.sender);
  }

  // Disable the base deposit function, use invest instead.
  function deposit(address _payee) payable public {
    revert();
  }

  function close() onlyOwner public {
    require(state == State.Active);
    state = State.Closed;
    emit Closed();
  }

  function enableRefunds() onlyOwner public {
    require(state == State.Active);
    state = State.Refunding;
    emit RefundsEnabled();
  }

  function withdrawalAllowed(address _payee) public view returns (bool) {
    return state == State.Refunding;
  }

  function withdraw(address _payee) public {
    if (_payee == beneficiary) {
      beneficiaryWithdrawal();
    } else {
      super.withdraw(_payee);
    }
  }

  function beneficiaryWithdrawal() internal {
    require(state == State.Closed);
    beneficiary.transfer(address(this).balance);
  }
}
