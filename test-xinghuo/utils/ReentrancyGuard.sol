pragma solidity ^0.8.20;

import {ReentrancyGuard} from "../../openzeppelin-contracts/contracts/utils/ReentrancyGuard.sol";

contract MyReentrancyGuard is ReentrancyGuard{
    function normalCall() public nonReentrant{

    }

    function abnormalCall() public nonReentrant{
        normalCall();
    }
}