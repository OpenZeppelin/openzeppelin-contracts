pragma solidity ^0.4.23;

import "./ConditionalEscrow.sol";
import "../ownership/Ownable.sol";


/**
 * @title RefundEscrow
 * @dev Escrow that holds investor funds for a unique benefitiary, and allows for
 * either withdrawal by the benefiatiary, or refunds to the investors.
 */
contract RefundEscrow is ConditionalEscrow, Ownable {
  enum State { Active, Refunding, Closed }

  event Closed();
  event RefundsEnabled();
  event Refunded(address indexed investor, uint256 weiAmount);

  State public state;
  address public beneficiary;

  /**
   * @dev Constructor.
   * @param _beneficiary The beneficiary of the investments.
   */
  constructor(address _beneficiary) public {
    require(_beneficiary != address(0));
    beneficiary = _beneficiary;
    state = State.Active;
  }

  /**
   * @dev Stores funds that may later be refunded.
   * @param _investor The address funds will be sent to if a refund occurs.
   */
  function invest(address _investor) payable public {
    require(state == State.Active);
    super.deposit(_investor);
  }

  /**
   * @dev Disable the base deposit function, use invest instead.
   */
  function deposit(address _payee) payable public {
    revert();
  }

  /**
   * @dev Allows for the beneficiary to withdraw their funds, rejecting
   * further investments.
   */
  function close() onlyOwner public {
    require(state == State.Active);
    state = State.Closed;
    emit Closed();
  }

  /**
   * @dev Allows for refunds to take place, rejecting further investments.
   */
  function enableRefunds() onlyOwner public {
    require(state == State.Active);
    state = State.Refunding;
    emit RefundsEnabled();
  }

  /**
   * @dev Withdraws the beneficiary's funds.
   */
  function withdraw() public {
    require(state == State.Closed);
    beneficiary.transfer(address(this).balance);
  }

  /**
   * @dev Refunds an investor.
   * @param _investor The address to refund.
   */
  function refund(address _investor) public {
    uint256 amount = depositsOf(_investor);
    super.withdraw(_investor);
    emit Refunded(_investor, amount);
  }

  /**
   * @dev Returns whether investors can withdraw their investments (be refunded).
   */
  function withdrawalAllowed(address _payee) public view returns (bool) {
    return state == State.Refunding;
  }
}
