pragma solidity ^0.4.15;

import '../ReentrancyGuard.sol';
import '../math/SafeMath.sol';

/**
 * @title SplitPayment
 * @dev Base contract supporting the distribution of funds send to this contract to multiple payees.
 */
contract SplitPayment is ReentrancyGuard {
  using SafeMath for uint256;

  struct Payee {
    address addr;
    uint256 shares;
  }

  uint256 public totalShares = 0;
  uint256 public maxPayees = 0;

  mapping(address => uint256) payeeIndex;
  Payee[] payees;

  /**
   * @dev Constructor
   * @param _maxPayees Total number of payees allowed. Zero for no limit.
   */
  function SplitPayment(uint256 _maxPayees) {
    maxPayees = _maxPayees;
  }

  /**
   * @dev Modifier that throws if you want to distribute funds and you are not a payee.
   */
  modifier canDistribute() {
    require(isPayee(msg.sender));
    _;
  }

  /**
   * @dev Modifier that throws if not allowed to update payees.
   * Override from child contract with your own requirements for access control. 
   */
  modifier canUpdate() {
    _;
  }

  /**
   * @dev Add a new payee to the contract.
   * @param _payee The address of the payee to add.
   * @param _shares The number of shares owned by the payee.
   */
  function addPayee(address _payee, uint256 _shares) public canUpdate {
    require(_payee != address(0));
    require(_shares > 0);
    require(!isPayee(_payee));
    require(maxPayees == 0 || payees.length.add(1) <= maxPayees);

    payees.push(Payee(_payee, _shares));
    payeeIndex[_payee] = payees.length;
    totalShares = totalShares.add(_shares);
  }

  /**
   * @dev Add multiple payees to the contract.
   * @param _payees An array of addresses of payees to add.
   * @param _shares An array of the shares corresponding to each payee in the _payees array.
   */
  function addPayeeMany(address[] _payees, uint256[] _shares) public canUpdate {
    require(_payees.length == _shares.length);
    require(maxPayees == 0 || payees.length.add(_payees.length) <= maxPayees);

    for (uint256 i = 0; i < _payees.length; i++) {
      addPayee(_payees[i], _shares[i]);
    }
  }

  /**
   * @dev Return true if the payee is in the contract.
   * @param _payee The address of the payee to check.
   */
  function isPayee(address _payee) public constant returns (bool) {
    return payeeIndex[_payee] > 0;
  }

  /**
   * @dev Return the number of payees in the contract.
   */
  function getPayeeCount() public constant returns (uint256) {
    return payees.length;
  }

  /**
   * @dev Return the address of the payee and its shares.
   * Throws if the payee is not in the contract.
   * @param _payee The address of the payee to get.
   */
  function getPayee(address _payee) public constant returns (address, uint256) {
    require(isPayee(_payee));

    return getPayeeAtIndex(payeeIndex[_payee] - 1);
  }

  /**
   * @dev Return the address of the payee and its shares by index. 
   * Allows iterating through the payee list from a client by knowing the payee count.
   * @param _idx The index of the payee in the internal list.
   */
  function getPayeeAtIndex(uint256 _idx) public constant returns (address, uint256) {
    require(_idx < payees.length);

    return (payees[_idx].addr, payees[_idx].shares);
  }

  /**
   * @dev Perform the payment to a payee. 
   * This can be overriden to provide different transfer mechanisms.
   * @param _payee The address of the payee to be paid.
   * @param _amount The amount for the payment.
   */
  function pay(address _payee, uint256 _amount) internal {
    _payee.transfer(_amount);
  }

  /**
   * @dev Return the total amount of funds available for distribution. 
   */
  function toDistribute() internal returns (uint256) {
    return this.balance;
  }

  /**
   * @dev Send payments to the registered payees according to their shares and the total 
   * amount of funds to distribute. 
   */
  function distributeFunds() public canDistribute nonReentrant {
    uint256 amountDistribute = toDistribute();
    assert(amountDistribute > 0);

    Payee memory payee;
    for (uint256 i = 0; i < payees.length; i++) {
      payee = payees[i];

      uint256 amount = amountDistribute.mul(payee.shares).div(totalShares);
      pay(payee.addr, amount);
    }
  }
}
