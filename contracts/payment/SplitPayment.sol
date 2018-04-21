pragma solidity ^0.4.21;

import "../math/SafeMath.sol";
import "../token/ERC20/ERC20Basic.sol";


/**
 * @title SplitPayment
 * @dev Base contract that supports multiple payees claiming funds sent to this contract
 * according to the proportion they own.
 */
contract SplitPayment {
  using SafeMath for uint256;

  uint256 public totalShares = 0;
  uint256 public totalReleased = 0;
  mapping(address => uint256) public tokensTotalReleased;

  mapping(address => uint256) public shares;
  mapping(address => uint256) public released;
  mapping(address => mapping(address => uint256)) public tokensReleased;
  address[] public payees;

  /**
   * @dev Constructor
   */
  function SplitPayment(address[] _payees, uint256[] _shares) public payable {
    require(_payees.length == _shares.length);

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

    require(shares[payee] > 0);

    uint256 totalReceived = address(this).balance.add(totalReleased);
    uint256 payment = totalReceived.mul(shares[payee]).div(totalShares).sub(released[payee]);

    require(payment != 0);
    require(address(this).balance >= payment);

    released[payee] = released[payee].add(payment);
    totalReleased = totalReleased.add(payment);

    payee.transfer(payment);
  }

  /**
   * @dev Claim your share of the balance through ERC20 token.
   */
  function claim(ERC20Basic token) public {
    address payee = msg.sender;

    require(shares[payee] > 0);

    uint256 totalTokenReleased = tokensTotalReleased[address(token)];
    uint256 payeeTokenReleased = tokensReleased[address(token)][payee];

    uint256 totalReceived = token.balanceOf(address(this)).add(totalTokenReleased);
    uint256 payment = totalReceived.mul(shares[payee]).div(totalShares).sub(payeeTokenReleased);

    require(payment != 0);
    require(token.balanceOf(address(this)) >= payment);

    tokensReleased[address(token)][payee] = payeeTokenReleased.add(payment);
    tokensTotalReleased[address(token)] = totalTokenReleased.add(payment);

    token.transfer(payee, payment);
  }

  /**
   * @dev Add a new payee to the contract.
   * @param _payee The address of the payee to add.
   * @param _shares The number of shares owned by the payee.
   */
  function addPayee(address _payee, uint256 _shares) internal {
    require(_payee != address(0));
    require(_shares > 0);
    require(shares[_payee] == 0);

    payees.push(_payee);
    shares[_payee] = _shares;
    totalShares = totalShares.add(_shares);
  }
}
