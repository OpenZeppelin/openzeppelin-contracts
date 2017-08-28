pragma solidity ^0.4.11;

import '../../contracts/token/ERC20.sol';
import '../../contracts/token/SafeERC20.sol';

contract ERC20FailingMock is ERC20 {
  function transfer(address, uint256) returns (bool) {
    return false;
  }

  function transferFrom(address, address, uint256) returns (bool) {
    return false;
  }

  function approve(address, uint256) returns (bool) {
    return false;
  }

  function balanceOf(address) constant returns (uint256) {
    return 0;
  }

  function allowance(address, address) constant returns (uint256) {
    return 0;
  }
}

contract SafeERC20Helper {
  using SafeERC20 for ERC20;

  ERC20 token;

  function SafeERC20Helper() {
    token = new ERC20FailingMock();
  }

  function doFailingTransfer() {
    token.safeTransfer(0, 0);
  }

  function doFailingTransferFrom() {
    token.safeTransferFrom(0, 0, 0);
  }

  function doFailingApprove() {
    token.safeApprove(0, 0);
  }
}
