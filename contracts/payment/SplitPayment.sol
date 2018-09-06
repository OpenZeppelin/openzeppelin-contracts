pragma solidity ^0.4.24;

import "../math/SafeMath.sol";


/**
 * @title SplitPayment
 * @dev This contract can be used when payments need to be received by a group
 * of people and split proportionately to some number of shares they own.
 */
contract SplitPayment {
  using SafeMath for uint256;

  uint256 private totalShares_ = 0;
  uint256 private totalReleased_ = 0;

  mapping(address => uint256) private shares_;
  mapping(address => uint256) private released_;
  address[] private payees_;

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
   * @return the total shares of the contract.
   */
  function totalShares() public view returns(uint256) {
    return totalShares_;
  }

  /**
   * @return the total amount already released.
   */
  function totalReleased() public view returns(uint256) {
    return totalReleased_;
  }

  /**
   * @return the shares of an account.
   */
  function shares(address _account) public view returns(uint256) {
    return shares_[_account];
  }

  /**
   * @return the amount already released to an account.
   */
  function released(address _account) public view returns(uint256) {
    return released_[_account];
  }

  /**
   * @return the address of a payee.
   */
  function payee(uint256 index) public view returns(address) {
    return payees_[index];
  }

  /**
   * @dev Release one of the payee's proportional payment.
   * @param _payee Whose payments will be released.
   */
  function release(address _payee) public {
    require(shares_[_payee] > 0);

    uint256 totalReceived = address(this).balance.add(totalReleased_);
    uint256 payment = totalReceived.mul(
      shares_[_payee]).div(
        totalShares_).sub(
          released_[_payee]
    );

    require(payment != 0);
    assert(address(this).balance >= payment);

    released_[_payee] = released_[_payee].add(payment);
    totalReleased_ = totalReleased_.add(payment);

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
    require(shares_[_payee] == 0);

    payees_.push(_payee);
    shares_[_payee] = _shares;
    totalShares_ = totalShares_.add(_shares);
  }
}
