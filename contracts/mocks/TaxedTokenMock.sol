pragma solidity ^0.4.18;

import "../token/ERC20/TaxedToken.sol";


contract TaxedTokenMock is TaxedToken {

  function TaxedTokenMock(
    address initialAccount,
    uint256 initialBalance,
    address _feeAccount,
    uint _maxTransferFee,
    uint8 _transferFeePercentage
  ) public
  {
    balances[initialAccount] = initialBalance;
    totalSupply_ = initialBalance;

    feeAccount = _feeAccount;
    maxTransferFee = _maxTransferFee;
    transferFeePercentage = _transferFeePercentage;
  }
}
