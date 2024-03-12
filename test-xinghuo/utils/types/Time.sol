pragma solidity ^0.8.20;

import {Time} from "../../../openzeppelin-contracts/contracts/utils/types/Time.sol";

contract MyTime {
    function timestamp() public returns(uint48){
        return Time.timestamp();
    }

    function blockNumber() public returns(uint48) {
        return Time.blockNumber();
    }

    function toDelay() public returns(uint32, uint32, uint48) {
        Time.Delay de =  Time.toDelay(10);
        return Time.getFull(de);
    }

    function get() public returns(uint32) {
        Time.Delay de =  Time.toDelay(10);
        return Time.get(de);
    }

    function withUpdate() public returns(Time.Delay, uint48) {
        Time.Delay de =  Time.toDelay(10);
        uint32 newValue = 20;
        uint32 minSetback = 15;
        return Time.withUpdate(de, newValue, minSetback);
    }
}