pragma solidity ^0.4.24;

import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";
import "../token/ERC20/ERC20.sol";
import "../token/ERC20/SafeERC20.sol";


/**
 * @title TokenEscrow
 * @dev Holds tokens destinated to a payee until they withdraw them.
 * The contract that uses the TokenEscrow as its payment method
 * should be its owner, and provide public methods redirecting
 * to the TokenEscrow's deposit and withdraw.
 * Moreover, the TokenEscrow should also be allowed to transfer
 * tokens from the payer to itself.
 */
contract TokenEscrow is Ownable {
  using SafeMath for uint256;
  using SafeERC20 for ERC20;

  event Deposited(address indexed payee, uint256 tokenAmount);
  event Withdrawn(address indexed payee, uint256 tokenAmount);

  mapping(address => uint256) private deposits;

  ERC20 public token;

  constructor (ERC20 _token) public {
    require(_token != address(0));
    token = _token;
  }

  function depositsOf(address _payee) public view returns (uint256) {
    return deposits[_payee];
  }

  /**
  * @dev Puts in escrow a certain amount of tokens as credit to be withdrawn.
  * @param _payee The destination address of the tokens.
  * @param _amount The amount of tokens to deposit in escrow.
  */
  function deposit(address _payee, uint256 _amount) public onlyOwner {
    deposits[_payee] = deposits[_payee].add(_amount);

    token.safeTransferFrom(msg.sender, address(this), _amount);

    emit Deposited(_payee, _amount);
  }

  /**
  * @dev Withdraw accumulated tokens for a payee.
  * @param _payee The address whose tokens will be withdrawn and transferred to.
  */
  function withdraw(address _payee) public onlyOwner {
    uint256 payment = deposits[_payee];
    assert(token.balanceOf(address(this)) >= payment);

    deposits[_payee] = 0;

    token.safeTransfer(_payee, payment);

    emit Withdrawn(_payee, payment);
  }
}
