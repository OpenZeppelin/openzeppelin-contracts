// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./Checkpoints.sol";

library Voting {
    using Checkpoints for Checkpoints.History;

    struct Votes {
        mapping(address => address)             _delegation;
        mapping(address => Checkpoints.History) _userCheckpoints;
        Checkpoints.History                     _totalCheckpoints;
    }

    function getVotes(Votes storage self, address account) internal view returns (uint256) {
        return self._userCheckpoints[account].latest();
    }

    function getVotesAt(Votes storage self, address account, uint256 timestamp) internal view returns (uint256) {
        return self._userCheckpoints[account].past(timestamp);
    }

    function getTotalVotes(Votes storage self) internal view returns (uint256) {
        return self._totalCheckpoints.latest();
    }
    
    function getTotalAccountVotes(Votes storage self, address account) internal view returns (uint256) {
        return self._userCheckpoints[account].length();
    } 

    function getTotalAccountVotesAt(Votes storage self, address account, uint32 pos) internal view returns (Checkpoints.Checkpoint memory) {
        return self._userCheckpoints[account].at(pos);
    } 

    function getTotalVotesAt(Votes storage self, uint256 timestamp) internal view returns (uint256) {
        return self._totalCheckpoints.past(timestamp);
    }

    function delegates(Votes storage self, address account) internal view returns (address) {
        return self._delegation[account];
    }

    function delegate(Votes storage self, address account, address newDelegation, uint256 balance) internal {
        address oldDelegation = delegates(self, account);
        self._delegation[account] = newDelegation;
       _moveVotingPower(self, oldDelegation, newDelegation, balance, _dummy);
    }

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

    function mint(Votes storage self, address to, uint256 amount) internal {
        self._totalCheckpoints.push(_add, amount);
       _moveVotingPower(self, address(0), delegates(self, to), amount, _dummy);
    }

    function mint(
        Votes storage self,
        address to,
        uint256 amount,
        function(address, uint256, uint256) hookDelegateVotesChanged
    ) internal {
        self._totalCheckpoints.push(_add, amount);
       _moveVotingPower(self, address(0), delegates(self, to), amount, hookDelegateVotesChanged);
    }

    function burn(Votes storage self, address from, uint256 amount) internal {
        self._totalCheckpoints.push(_subtract, amount);
       _moveVotingPower(self, delegates(self, from), address(0), amount, _dummy);
    }

    function burn(
        Votes storage self,
        address from,
        uint256 amount,
        function(address, uint256, uint256) hookDelegateVotesChanged
    ) internal {
        self._totalCheckpoints.push(_subtract, amount);
       _moveVotingPower(self, delegates(self, from), address(0), amount, hookDelegateVotesChanged);
    }

    function transfer(Votes storage self, address from, address to, uint256 amount) internal {
       _moveVotingPower(self, delegates(self, from), delegates(self, to), amount, _dummy);
    }

    function transfer(
        Votes storage self,
        address from,
        address to,
        uint256 amount,
        function(address, uint256, uint256) hookDelegateVotesChanged
    ) internal {
       _moveVotingPower(self, delegates(self, from), delegates(self, to), amount, hookDelegateVotesChanged);
    }

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

    function _add(uint256 a, uint256 b) private pure returns (uint256) {
        return a + b;
    }

    function _subtract(uint256 a, uint256 b) private pure returns (uint256) {
        return a - b;
    }

    function _dummy(address, uint256, uint256) private pure {}

}
