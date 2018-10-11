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

  function increaseAllowance(address, uint256) public returns (bool){
    return false;
  }

  function decreaseAllowance(address, uint256) public returns (bool){
    return false;
  }

  function balanceOf(address) public view returns (uint256) {
    return 0;
  }

  function allowance(address, address) public view returns (uint256) {
    return 0;
  }
}

contract ERC20SucceedingMock {
    uint256 private _allowance;

    function transfer(address, uint256) public returns (bool) {
        return true;
    }

    function transferFrom(address, address, uint256) public returns (bool) {
        return true;
    }

    function approve(address, uint256) public returns (bool) {
        return true;
    }

  function increaseAllowance(address, uint256) public returns (bool){
    return true;
  }

  function decreaseAllowance(address, uint256) public returns (bool){
    return true;
  }

  function balanceOf(address) public view returns (uint256) {
    return 0;
  }

    function allowance(address, address) public view returns (uint256) {
        return _allowance;
    }
}

contract SafeERC20Helper {
    using SafeERC20 for IERC20;

    IERC20 private _failing;
    IERC20 private _succeeding;

    constructor () public {
        _failing = IERC20(new ERC20FailingMock());
        _succeeding = IERC20(new ERC20SucceedingMock());
    }

    // Using _failing

    function doFailingTransfer() public {
        _failing.safeTransfer(address(0), 0);
    }

    function doFailingTransferFrom() public {
        _failing.safeTransferFrom(address(0), address(0), 0);
    }

    function doFailingApprove() public {
        _failing.safeApprove(address(0), 0);
    }

    function doFailingIncreaseAllowance() public {
        _failing.safeIncreaseAllowance(address(0), 0);
    }

    function doFailingDecreaseAllowance() public {
        _failing.safeDecreaseAllowance(address(0), 0);
    }

    // Using _succeeding

    function doSucceedingTransfer() public {
        _succeeding.safeTransfer(address(0), 0);
    }

    function doSucceedingTransferFrom() public {
        _succeeding.safeTransferFrom(address(0), address(0), 0);
    }

    function doSucceedingApprove(uint256 amount) public {
        _succeeding.safeApprove(address(0), amount);
    }

    function doSucceedingIncreaseAllowance(uint256 amount) public {
        _succeeding.safeIncreaseAllowance(address(0), amount);
    }

  function doFailingIncreaseAllowance() public {
    _failing.safeIncreaseAllowance(address(0), 0);
  }

  function doFailingDecreaseAllowance() public {
    _failing.safeDecreaseAllowance(address(0), 0);
  }

  function doSucceedingTransfer() public {
    _succeeding.safeTransfer(address(0), 0);
  }

    function setAllowance(uint256 allowance_) public {
        ERC20SucceedingMock(_succeeding).setAllowance(allowance_);
    }

  function doSucceedingApprove() public {
    _succeeding.safeApprove(address(0), 0);
  }

  function doSucceedingIncreaseAllowance() public {
    _succeeding.safeIncreaseAllowance(address(0), 0);
  }

  function doSucceedingDecreaseAllowance() public {
    _succeeding.safeDecreaseAllowance(address(0), 0);
  }
}
