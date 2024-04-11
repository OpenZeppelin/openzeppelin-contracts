// SPDX-License-Identifier: GPL-3.0-only
pragma solidity ^0.8.23;

import {IEntryPointStake} from "../interfaces/IERC4337.sol";
import {Address} from "../utils/Address.sol";

abstract contract StakeManager is IEntryPointStake {
    event Deposited(address indexed account, uint256 totalDeposit);

    event Withdrawn(address indexed account, address withdrawAddress, uint256 amount);

    event StakeLocked(address indexed account, uint256 totalStaked, uint256 unstakeDelaySec);

    event StakeUnlocked(address indexed account, uint256 withdrawTime);

    event StakeWithdrawn(address indexed account, address withdrawAddress, uint256 amount);

    struct DepositInfo {
        uint256 deposit;
        bool staked;
        uint112 stake;
        uint32 unstakeDelaySec;
        uint48 withdrawTime;
    }

    struct StakeInfo {
        uint256 stake;
        uint256 unstakeDelaySec;
    }

    mapping(address => DepositInfo) private _deposits;

    receive() external payable {
        depositTo(msg.sender);
    }

    function balanceOf(address account) public view returns (uint256) {
        return _deposits[account].deposit;
    }

    function depositTo(address account) public payable virtual {
        uint256 newDeposit = _incrementDeposit(account, msg.value);
        emit Deposited(account, newDeposit);
    }

    function addStake(uint32 unstakeDelaySec) public payable {
        DepositInfo storage info = _deposits[msg.sender];
        require(unstakeDelaySec > 0, "must specify unstake delay");
        require(unstakeDelaySec >= info.unstakeDelaySec, "cannot decrease unstake time");

        uint256 stake = info.stake + msg.value;
        require(stake > 0, "no stake specified");
        require(stake <= type(uint112).max, "stake overflow");

        _deposits[msg.sender] = DepositInfo(info.deposit, true, uint112(stake), unstakeDelaySec, 0);

        emit StakeLocked(msg.sender, stake, unstakeDelaySec);
    }

    function unlockStake() public {
        DepositInfo storage info = _deposits[msg.sender];
        require(info.unstakeDelaySec != 0, "not staked");
        require(info.staked, "already unstaking");

        uint48 withdrawTime = uint48(block.timestamp) + info.unstakeDelaySec;
        info.withdrawTime = withdrawTime;
        info.staked = false;

        emit StakeUnlocked(msg.sender, withdrawTime);
    }

    function withdrawStake(address payable withdrawAddress) public {
        DepositInfo storage info = _deposits[msg.sender];
        uint256 stake = info.stake;
        if (stake > 0) {
            require(info.withdrawTime > 0, "must call unlockStake() first");
            require(info.withdrawTime <= block.timestamp, "Stake withdrawal is not due");

            info.unstakeDelaySec = 0;
            info.withdrawTime = 0;
            info.stake = 0;

            emit StakeWithdrawn(msg.sender, withdrawAddress, stake);
            Address.sendValue(withdrawAddress, stake);
        }
    }

    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) public {
        _deposits[msg.sender].deposit -= withdrawAmount;
        emit Withdrawn(msg.sender, withdrawAddress, withdrawAmount);
        Address.sendValue(withdrawAddress, withdrawAmount);
    }

    function _incrementDeposit(address account, uint256 amount) internal returns (uint256) {
        return _deposits[account].deposit += amount;
    }

    function _decrementDeposit(address account, uint256 amount) internal returns (uint256) {
        return _deposits[account].deposit -= amount;
    }
}
