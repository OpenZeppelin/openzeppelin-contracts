pragma solidity ^0.4.18;

import "./BasicToken.sol";
import "../../math/Math.sol";
import "../../math/SafeMath.sol";


contract TaxedToken is BasicToken {
  using SafeMath for uint256;

  uint8 public decimals = 2;

  address internal feeAccount;
  uint256 internal maxTransferFee;
  uint8 internal transferFeePercentage;

  /**
   * @dev Transfer tokens to a specified account after diverting a fee to a central account.
   * @param _to The receiving address.
   * @param _value The number of tokens to transfer.
   */
  function transfer(address _to, uint256 _value) public returns (bool) {
    require(_to != address(0));
    require(_value <= balances[msg.sender]);
    require(_value % (uint256(10) ** decimals) == 0);

    balances[msg.sender] = balances[msg.sender].sub(_value);

    uint256 fee = Math.min256(_value.mul(transferFeePercentage).div(100), maxTransferFee);
    uint256 taxedValue = _value.sub(fee);

    balances[_to] = balances[_to].add(taxedValue);
    Transfer(msg.sender, _to, taxedValue);

    balances[feeAccount] = balances[feeAccount].add(fee);
    Transfer(msg.sender, feeAccount, fee);

    return true;
  }
}
