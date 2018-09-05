pragma solidity ^0.4.24;

import "../math/SafeMath.sol";


/**
 * @title SplitPayment
 * @dev This contract can be used when payments need to be received by a group
 * of people and split proportionately to some number of shares they own.
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
    require(_payees.length == _shares.length);
    require(_payees.length > 0);

    for (uint256 i = 0; i < _payees.length; i++) {
      _addPayee(_payees[i], _shares[i]);
    }
  }

  /**
   * @dev payable fallback
   */
  function () external payable {}

  /**
   * @dev Release one of the payee's proportional payment.
   * @param _payee Whose payments will be released.
   */
  function release(address _payee) public {
    require(shares[_payee] > 0);

    uint256 totalReceived = address(this).balance.add(totalReleased);
    uint256 payment = totalReceived.mul(
      shares[_payee]).div(
        totalShares).sub(
          released[_payee]
    );

    require(payment != 0);
    assert(address(this).balance >= payment);

    released[_payee] = released[_payee].add(payment);
    totalReleased = totalReleased.add(payment);

    _payee.transfer(payment);
  }

  /**
   * @dev Add a new payee to the contract.
   * @param _payee The address of the payee to add.
   * @param _shares The number of shares owned by the payee.
   */
  function _addPayee(address _payee, uint256 _shares) internal {
    require(_payee != address(0));
    require(_shares > 0);
    require(shares[_payee] == 0);

    payees.push(_payee);
    shares[_payee] = _shares;
    totalShares = totalShares.add(_shares);
  }
}
