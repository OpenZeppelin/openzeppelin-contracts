pragma solidity ^0.4.24;

import "../token/ERC20/IERC20.sol";
import "../token/ERC20/SafeERC20.sol";


contract ERC20FailingMock is IERC20 {
  function totalSupply() public view returns (uint256) {
    return 0;
  }

  function transfer(address, uint256) public returns (bool) {
    return false;
  }

  function transferFrom(address, address, uint256) public returns (bool) {
    return false;
  }

  function approve(address, uint256) public returns (bool) {
    return false;
  }

  function balanceOf(address) public view returns (uint256) {
    return 0;
  }

  function allowance(address, address) public view returns (uint256) {
    return 0;
  }
}


contract ERC20SucceedingMock is IERC20 {
  function totalSupply() public view returns (uint256) {
    return 0;
  }

  function transfer(address, uint256) public returns (bool) {
    return true;
  }

  function transferFrom(address, address, uint256) public returns (bool) {
    return true;
  }

  function approve(address, uint256) public returns (bool) {
    return true;
  }

  function balanceOf(address) public view returns (uint256) {
    return 0;
  }

  function allowance(address, address) public view returns (uint256) {
    return 0;
  }
}


contract SafeERC20Helper {
  using SafeERC20 for IERC20;

  IERC20 internal failing_;
  IERC20 internal succeeding_;

  constructor() public {
    failing_ = new ERC20FailingMock();
    succeeding_ = new ERC20SucceedingMock();
  }

  function doFailingTransfer() public {
    failing_.safeTransfer(address(0), 0);
  }

  function doFailingTransferFrom() public {
    failing_.safeTransferFrom(address(0), address(0), 0);
  }

  function doFailingApprove() public {
    failing_.safeApprove(address(0), 0);
  }

  function doSucceedingTransfer() public {
    succeeding_.safeTransfer(address(0), 0);
  }

  function doSucceedingTransferFrom() public {
    succeeding_.safeTransferFrom(address(0), address(0), 0);
  }

  function doSucceedingApprove() public {
    succeeding_.safeApprove(address(0), 0);
  }
}
