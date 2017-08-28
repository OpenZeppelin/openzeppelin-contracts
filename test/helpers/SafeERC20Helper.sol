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

contract ERC20SucceedingMock is ERC20 {
  function transfer(address, uint256) returns (bool) {
    return true;
  }

  function transferFrom(address, address, uint256) returns (bool) {
    return true;
  }

  function approve(address, uint256) returns (bool) {
    return true;
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

  ERC20 failing;
  ERC20 succeeding;

  function SafeERC20Helper() {
    failing = new ERC20FailingMock();
    succeeding = new ERC20SucceedingMock();
  }

  function doFailingTransfer() {
    failing.safeTransfer(0, 0);
  }

  function doFailingTransferFrom() {
    failing.safeTransferFrom(0, 0, 0);
  }

  function doFailingApprove() {
    failing.safeApprove(0, 0);
  }

  function doSucceedingTransfer() {
    succeeding.safeTransfer(0, 0);
  }

  function doSucceedingTransferFrom() {
    succeeding.safeTransferFrom(0, 0, 0);
  }

  function doSucceedingApprove() {
    succeeding.safeApprove(0, 0);
  }
}
