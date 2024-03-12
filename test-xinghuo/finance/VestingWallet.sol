pragma solidity ^0.8.20;

import {VestingWallet} from "../../openzeppelin-contracts/contracts/finance/VestingWallet.sol";

contract MyVestingWallet is VestingWallet{
    constructor(address beneficiary, uint64 startTimestamp, uint64 durationSeconds) VestingWallet(beneficiary, startTimestamp, durationSeconds) {
    }

    function Start() public view returns (uint256) {
        return start();
    }

    function Duration() public view returns (uint256) {
        return duration();
    }

    function End() public view returns (uint256) {
        return end();
    }

    function Released() public view returns (uint256) {
        return released();
    }

    function Released(address token) public view returns (uint256) {
        return released(token);
    }

    function Releasable() public view returns (uint256) {
        return releasable();
    }

    function Releasable(address token) public view returns (uint256) {
        return releasable(token);
    }

    function Release() public{
        return release();
    }

    function Release(address token) public {
        return release(token);
    }

    function VestedAmount(uint64 timestamp) public view returns (uint256) {
        return vestedAmount(timestamp);
    }

    function VestedAmount(address token, uint64 timestamp) public view returns (uint256) {
        return vestedAmount(token, timestamp);
    }
}