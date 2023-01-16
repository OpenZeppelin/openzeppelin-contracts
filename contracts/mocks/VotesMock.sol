// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/utils/Votes.sol";

abstract contract VotesMock is Votes {
    mapping(address => uint256) private _votingUnits;

    function getTotalSupply() public view returns (uint256) {
        return _getTotalSupply();
    }

    function delegate(address account, address newDelegation) public {
        return _delegate(account, newDelegation);
    }

    function _getVotingUnits(address account) internal view override returns (uint256) {
        return _votingUnits[account];
    }

    function _mint(address account, uint256 votes) internal {
        _votingUnits[account] += votes;
        _transferVotingUnits(address(0), account, votes);
    }

    function _burn(address account, uint256 votes) internal {
        _votingUnits[account] += votes;
        _transferVotingUnits(account, address(0), votes);
    }
}
