pragma solidity ^0.5.2;

import "../token/ERC20/IERC20.sol";
import "../token/ERC20/SafeERC20.sol";

contract ERC20FailingMock {
    uint256 private _allowance;

    // IERC20's functions are not pure, but these mock implementations are: to prevent Solidity from issuing warnings,
    // we write to a dummy state variable.
    uint256 private _dummy;

    function transfer(address, uint256) public returns (bool) {
        _dummy = 0;
        return false;
    }

    function transferFrom(address, address, uint256) public returns (bool) {
        _dummy = 0;
        return false;
    }

    function approve(address, uint256) public returns (bool) {
        _dummy = 0;
        return false;
    }

    function allowance(address, address) public view returns (uint256) {
        require(_dummy == 0);
        return 0;
    }
}

contract ERC20SucceedingMock {
    uint256 private _allowance;

    // IERC20's functions are not pure, but these mock implementations are: to prevent Solidity from issuing warnings,
    // we write to a dummy state variable.
    uint256 private _dummy;

    function transfer(address, uint256) public returns (bool) {
        _dummy = 0;
        return true;
    }

    function transferFrom(address, address, uint256) public returns (bool) {
        _dummy = 0;
        return true;
    }

    function approve(address, uint256) public returns (bool) {
        _dummy = 0;
        return true;
    }

    function setAllowance(uint256 allowance_) public {
        _allowance = allowance_;
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
        _failing = IERC20(address(new ERC20FailingMock()));
        _succeeding = IERC20(address(new ERC20SucceedingMock()));
    }

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

    function doSucceedingDecreaseAllowance(uint256 amount) public {
        _succeeding.safeDecreaseAllowance(address(0), amount);
    }

    function setAllowance(uint256 allowance_) public {
        ERC20SucceedingMock(address(_succeeding)).setAllowance(allowance_);
    }

    function allowance() public view returns (uint256) {
        return _succeeding.allowance(address(0), address(0));
    }
}
