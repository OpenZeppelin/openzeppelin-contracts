// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Checkpoints.sol";

/**
 * @dev Voting operations.
 */
library Voting {
    using Checkpoints for Checkpoints.History;

    struct Votes {
        mapping(address => address)             _delegation;
        mapping(address => Checkpoints.History) _userCheckpoints;
        Checkpoints.History                     _totalCheckpoints;
    }

    /**
    * @dev Returns total amount of votes for account.
    */
    function getVotes(Votes storage self, address account) internal view returns (uint256) {
        return self._userCheckpoints[account].latest();
    }

    /**
    * @dev Returns total amount of votes at given position.
    */
    function getVotesAt(Votes storage self, address account, uint256 timestamp) internal view returns (uint256) {
        return self._userCheckpoints[account].past(timestamp);
    }

    /**
    * @dev Get checkpoint for `account` for specific position.
    */
    function getTotalAccountVotesAt(Votes storage self, address account, uint32 pos) internal view returns (Checkpoints.Checkpoint memory) {
        return self._userCheckpoints[account].at(pos);
    } 

    /**
    * @dev Returns total amount of votes. 
    */
    function getTotalVotes(Votes storage self) internal view returns (uint256) {
        return self._totalCheckpoints.latest();
    }
    
    /**
    * @dev Get number of checkpoints for `account`.
    */
    function getTotalAccountVotes(Votes storage self, address account) internal view returns (uint256) {
        return self._userCheckpoints[account].length();
    } 

    /**
    * @dev Returns all votes for timestamp.
    */
    function getTotalVotesAt(Votes storage self, uint256 timestamp) internal view returns (uint256) {
        return self._totalCheckpoints.past(timestamp);
    }

    /**
    * @dev Returns account delegation.
    */
    function delegates(Votes storage self, address account) internal view returns (address) {
        return self._delegation[account];
    }

    /**
    * @dev Delegates voting power.
    */
    function delegate(Votes storage self, address account, address newDelegation, uint256 balance) internal {
        address oldDelegation = delegates(self, account);
        self._delegation[account] = newDelegation;
       _moveVotingPower(self, oldDelegation, newDelegation, balance, _dummy);
    }

    /**
    * @dev Delegates voting power.
    */
    function delegate(
        Votes storage self,
        address account,
        address newDelegation,
        uint256 balance,
        function(address, uint256, uint256) hookDelegateVotesChanged
    ) internal {
        address oldDelegation = delegates(self, account);
        self._delegation[account] = newDelegation;
       _moveVotingPower(self, oldDelegation, newDelegation, balance, hookDelegateVotesChanged);
    }

    /**
    * @dev Mints new vote.
    */
    function mint(Votes storage self, address to, uint256 amount) internal {
        self._totalCheckpoints.push(_add, amount);
       _moveVotingPower(self, address(0), delegates(self, to), amount, _dummy);
    }

    /**
    * @dev Mints new vote.
    */
    function mint(
        Votes storage self,
        address to,
        uint256 amount,
        function(address, uint256, uint256) hookDelegateVotesChanged
    ) internal {
        self._totalCheckpoints.push(_add, amount);
       _moveVotingPower(self, address(0), delegates(self, to), amount, hookDelegateVotesChanged);
    }

    /**
    * @dev Burns new vote.
    */
    function burn(Votes storage self, address from, uint256 amount) internal {
        self._totalCheckpoints.push(_subtract, amount);
       _moveVotingPower(self, delegates(self, from), address(0), amount, _dummy);
    }

    /**
    * @dev Burns new vote.
    */
    function burn(
        Votes storage self,
        address from,
        uint256 amount,
        function(address, uint256, uint256) hookDelegateVotesChanged
    ) internal {
        self._totalCheckpoints.push(_subtract, amount);
       _moveVotingPower(self, delegates(self, from), address(0), amount, hookDelegateVotesChanged);
    }

    /**
    * @dev Transfers voting power.
    */
    function transfer(Votes storage self, address from, address to, uint256 amount) internal {
       _moveVotingPower(self, delegates(self, from), delegates(self, to), amount, _dummy);
    }

    /**
    * @dev Transfers voting power.
    */
    function transfer(
        Votes storage self,
        address from,
        address to,
        uint256 amount,
        function(address, uint256, uint256) hookDelegateVotesChanged
    ) internal {
       _moveVotingPower(self, delegates(self, from), delegates(self, to), amount, hookDelegateVotesChanged);
    }

    /**
    * @dev Moves voting power.
    */
   function _moveVotingPower(
        Votes storage self,
        address src,
        address dst,
        uint256 amount,
        function(address, uint256, uint256) hookDelegateVotesChanged
    ) private {
        if (src != dst && amount > 0) {
            if (src != address(0)) {
                (uint256 oldValue, uint256 newValue) = self._userCheckpoints[src].push(_subtract, amount);
                hookDelegateVotesChanged(src, oldValue, newValue);
            }
            if (dst != address(0)) {
                (uint256 oldValue, uint256 newValue) = self._userCheckpoints[dst].push(_add, amount);
                hookDelegateVotesChanged(dst, oldValue, newValue);
            }
        }
    }

    /**
    * @dev Adds two numbers.
    */
    function _add(uint256 a, uint256 b) private pure returns (uint256) {
        return a + b;
    }

    /**
    * @dev Subtracts two numbers.
    */
    function _subtract(uint256 a, uint256 b) private pure returns (uint256) {
        return a - b;
    }

    function _dummy(address, uint256, uint256) private pure {}

}
