pragma solidity ^0.8.0;

import "../munged/governance/utils/Votes.sol";

 contract VotesHarness is Votes {

     constructor(string memory name, string memory version) EIP712(name, version) {

     }
     
     function _getVotingUnits(address) public override returns (uint256) {
         return 0;
     }
}