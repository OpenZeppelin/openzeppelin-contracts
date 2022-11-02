// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;
import "../../../access/Ownable.sol";
import "../IERC20.sol";

contract Locker2022 is Ownable {
    uint private constant _SECONDS_PER_DAY = 24 * 60 * 60;
    uint private constant _SECONDS_PER_HOUR = 60 * 60;
    uint private constant _SECONDS_PER_MINUTE = 60;
    int private constant _OFFSET19700101 = 2440588;

    function _daysFromDate(uint year, uint month, uint day) internal pure returns (uint _days) {
        require(year >= 1970);
        int _year = int(year);
        int _month = int(month);
        int _day = int(day);

        int __days = _day
          - 32075
          + 1461 * (_year + 4800 + (_month - 14) / 12) / 4
          + 367 * (_month - 2 - (_month - 14) / 12 * 12) / 12
          - 3 * ((_year + 4900 + (_month - 14) / 12) / 100) / 4
          - _OFFSET19700101;

        _days = uint(__days);
    }

    function _timestampFromDateTime(uint year, uint month, uint day, uint hour, uint minute, uint second) internal pure returns (uint timestamp) {
        timestamp = _daysFromDate(year, month, day) * _SECONDS_PER_DAY + hour * _SECONDS_PER_HOUR + minute * _SECONDS_PER_MINUTE + second;
    }

    using SafeMath for uint256;
    IERC20 _tokenization;

    uint public numberOfDistributionCompleted;
    bool _firstDistributed;
    uint public lastTimeDistributed;
    uint256 public nextAmountOfDistribution;
    uint256 public totalUnlocked;

    event TokenUnlocked(uint256 amount, uint256 dateTime, uint _numberOfDistributionCompleted);

    uint public unlockTime = _timestampFromDateTime(2022, 8, 31, 23, 59, 59);

    bool internal _inUnlockingProcess;

    modifier lockTheUnlockProcess() {
        require(!_inUnlockingProcess, "No re-entrancy");
        _inUnlockingProcess = true;
        _;
        _inUnlockingProcess = false;
    }

    constructor (address tokenAddress, uint256 amount) {
        _tokenization = IERC20(tokenAddress);
        numberOfDistributionCompleted = 0;
        _firstDistributed = false;
        nextAmountOfDistribution = amount;
    }

    function firstDistributeTheLockedTokens() public virtual onlyOwner lockTheUnlockProcess() returns (bool) {
        require(unlockTime <= block.timestamp, "Unlock time is not there yet!");
        require(_firstDistributed == false, "Already executed!");

        _tokenization.transfer(msg.sender, nextAmountOfDistribution);
        totalUnlocked += nextAmountOfDistribution;
        lastTimeDistributed = block.timestamp;
        _firstDistributed = true;
        emit TokenUnlocked(nextAmountOfDistribution, lastTimeDistributed, numberOfDistributionCompleted + 1);
        numberOfDistributionCompleted += 1;
        nextAmountOfDistribution = nextAmountOfDistribution.div(101255).mul(100000);
        return true;
    }

    function readFirstDistributed() public view onlyOwner returns (bool) {
        return _firstDistributed;
    }

    function nextDistributionTheLockedTokens() public virtual onlyOwner lockTheUnlockProcess() returns (bool) {
        require(unlockTime <= block.timestamp, "Unlock time is not there yet!");
        require(_firstDistributed == true, "firstDistributeTheLockedTokens function hasn't been executed yet!");
        require(lastTimeDistributed + 30 days <= block.timestamp, "It hasn't been 1 second yet!");
        require(numberOfDistributionCompleted <= 59, "All distributions are completed!");
        lastTimeDistributed = block.timestamp;
        if (numberOfDistributionCompleted == 59) {
            _tokenization.transfer(msg.sender, nextAmountOfDistribution.div(100).mul(90));
            totalUnlocked += nextAmountOfDistribution.div(100).mul(90);
        } else {
            _tokenization.transfer(msg.sender, nextAmountOfDistribution);
            totalUnlocked += nextAmountOfDistribution;
        }
        emit TokenUnlocked(nextAmountOfDistribution, lastTimeDistributed, numberOfDistributionCompleted + 1);
        numberOfDistributionCompleted += 1;
        nextAmountOfDistribution = nextAmountOfDistribution.div(101255).mul(100000);
        return true;
    }
    function readBalanceOfLocker() public view virtual onlyOwner returns (uint256) {
        return _tokenization.balanceOf(address(this));
    }
    function unlockHundredYearsLater() public virtual onlyOwner lockTheUnlockProcess() returns (bool) {
        require(numberOfDistributionCompleted == 60, "Either it's already been 60 distributions or already exceeded it!");
        uint256 _thisBalance = _tokenization.balanceOf(address(this));
        require(_thisBalance > 0, "Contract doesn't have balance!");
        _tokenization.transfer(msg.sender, _thisBalance);
        if (numberOfDistributionCompleted == 60) {
            nextAmountOfDistribution = 0;
        }
        totalUnlocked += _thisBalance;
        numberOfDistributionCompleted++;
        return true;
    }

}

library SafeMath {

    function tryAdd(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            uint256 c = a + b;
            if (c < a) return (false, 0);
            return (true, c);
        }
    }
    function trySub(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b > a) return (false, 0);
            return (true, a - b);
        }
    }
    function tryMul(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            // Gas optimizatison: this is cheaper than requiring 'a' not being zero, but the
            // benefit is lost if 'b' is also tested.
            // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
            if (a == 0) return (true, 0);
            uint256 c = a * b;
            if (c / a != b) return (false, 0);
            return (true, c);
        }
    }
    function tryDiv(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a / b);
        }
    }
    function tryMod(uint256 a, uint256 b) internal pure returns (bool, uint256) {
        unchecked {
            if (b == 0) return (false, 0);
            return (true, a % b);
        }
    }
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        return a + b;
    }
    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return a - b;
    }
    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        return a * b;
    }
    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return a / b;
    }
    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return a % b;
    }
    function sub(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b <= a, errorMessage);
            return a - b;
        }
    }
    function div(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a / b;
        }
    }
    function mod(
        uint256 a,
        uint256 b,
        string memory errorMessage
    ) internal pure returns (uint256) {
        unchecked {
            require(b > 0, errorMessage);
            return a % b;
        }
    }
}