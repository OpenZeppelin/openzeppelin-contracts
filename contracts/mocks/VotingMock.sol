// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/utils/Votes.sol";

contract VotesMock is Votes {
    constructor(string memory name) EIP712(name, "1") {}

    function getTotalVotes() public view returns (uint256) {
        return _getTotalVotes();
    }

    function delegate(address account, address newDelegation) public {
        return _delegate(account, newDelegation);
    }

    function _getDelegatorVotingPower(address) internal virtual override returns (uint256) {
        return 1;
    }

    function giveVotingPower(address account, uint8 amount) external {
        _transferVotingAssets(address(0), account, amount);
    }
}
