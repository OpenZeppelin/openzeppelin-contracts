pragma solidity ^0.4.23;

import "../math/SafeMath.sol";


/**
 * @title SplitPayment
 * @dev Base contract that supports multiple payees claiming funds sent to this contract
 * according to the proportion they own.
 */
contract SplitPayment {
  using SafeMath for uint256;

  uint256 public totalShares = 0;
  uint256 public totalReleased = 0;

  mapping(address => uint256) public shares;
  mapping(address => uint256) public released;
  address[] public payees;

  /**
   * @dev Constructor
   */
  constructor(address[] _payees, uint256[] _shares) public payable {
    require(_payees.length == _shares.length, "Amount of payees and shares do not match");

    for (uint256 i = 0; i < _payees.length; i++) {
      addPayee(_payees[i], _shares[i]);
    }
  }

  /**
   * @dev payable fallback
   */
  function () public payable {}

  /**
   * @dev Claim your share of the balance.
   */
  function claim() public {
    address payee = msg.sender;

    require(shares[payee] > 0, "No share was found");

    uint256 totalReceived = address(this).balance.add(totalReleased);
    uint256 payment = totalReceived.mul(shares[payee]).div(totalShares).sub(released[payee]);

    require(payment != 0, "The share for the payee is zero");
    require(address(this).balance >= payment, "Not enough funds to do the payment");

    released[payee] = released[payee].add(payment);
    totalReleased = totalReleased.add(payment);

    payee.transfer(payment);
  }

  /**
   * @dev Add a new payee to the contract.
   * @param _payee The address of the payee to add.
   * @param _shares The number of shares owned by the payee.
   */
  function addPayee(address _payee, uint256 _shares) internal {
    require(_payee != address(0), "Invalid payee address");
    require(_shares > 0, "Shares must be positive");
    require(shares[_payee] == 0, "Payee already added");

    payees.push(_payee);
    shares[_payee] = _shares;
    totalShares = totalShares.add(_shares);
  }
}
