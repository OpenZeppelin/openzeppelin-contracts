// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Datetime.sol";

contract DatetimeMock {
    function date(
        int32 _year,
        uint8 _month,
        uint8 _day
    ) external pure returns (int256) {
        return Datetime.date(_year, _month, _day);
    }

    function datetime(
        int32 _year,
        uint8 _month,
        uint8 _day,
        uint8 _hour,
        uint8 _minute,
        uint8 _second
    ) public pure returns (int256) {
        return Datetime.datetime(_year, _month, _day, _hour, _minute, _second);
    }
}
