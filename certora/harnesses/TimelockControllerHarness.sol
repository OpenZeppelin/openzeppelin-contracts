pragma solidity ^0.8.0;

import "../munged/governance/TimelockController.sol";

 contract TimelockControllerHarness is TimelockController {
     constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors
     ) TimelockController(minDelay, proposers, executors) {

     }
}