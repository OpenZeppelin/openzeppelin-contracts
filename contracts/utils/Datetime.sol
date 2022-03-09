// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Datetime.sol)

pragma solidity ^0.8.0;

/// @title Datetime utility functions
/// @author Seth Charles (@lesserhatch)
/// @dev All function calls are currently implemented without side effects
library Datetime {
    /// @notice Convert civil date to Unix time
    /// @param _year Civil year where negative years are prior to 0 A.D.
    /// @param _month Numeric month representation in the range [1, 12]
    /// @param _day Day of month
    /// @dev Invalid dates will revert
    /// @return Number of seconds elapsed since the Unix epoch
    function date(
        int32 _year,
        uint32 _month,
        uint32 _day
    ) public pure returns (int256) {
        _validDate(_year, _month, _day);
        return _daysFromCivil(_year, _month, _day) * 1 days;
    }

    /// @notice Convert civil date and time to Unix time
    /// @param _year Civil year where negative years are prior to 0 A.D.
    /// @param _month Numeric month representation in the range [1, 12]
    /// @param _day Day of month
    /// @param _hour Hour of day in the range [0, 23]
    /// @param _minute Minute of hour in the range [0, 59]
    /// @param _second Second of minute in the range of [0, 59]
    /// @dev Invalid dates and times will revert
    /// @return Number of seconds elapsed since the Unix epoch
    function datetime(
        int32 _year,
        uint32 _month,
        uint32 _day,
        uint32 _hour,
        uint32 _minute,
        uint32 _second
    ) public pure returns (int256) {
        _validTime(_hour, _minute, _second);
        return
            date(_year, _month, _day) +
            int256(int32(_hour * 1 hours)) +
            int256(int32(_minute * 1 minutes)) +
            int256(int32(_second * 1 seconds));
    }

    function _daysFromCivil(
        int256 _year,
        uint256 _month,
        uint256 _day
    ) private pure returns (int256) {
        // Inspired by the days_from_civil algorithm at https://howardhinnant.github.io/date_algorithms.html
        if (_month <= 2) {
            _year = _year - 1;
        }

        int256 era;
        if (_year >= 0) {
            era = _year;
        } else {
            era = _year - 399;
        }
        era = era / 400;

        uint256 yoe = uint256(_year - era * 400);

        uint256 doy = 153;
        if (_month > 2) {
            doy = doy * (_month - 3);
        } else {
            doy = doy * (_month + 9);
        }
        doy = (doy + 2) / 5 + (_day - 1);

        uint256 doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;

        return era * 146097 + int256(doe) - 719468;
    }

    function _isLeapYear(int32 _year) private pure returns (bool) {
        return (_year % 4 == 0 && (_year % 100 != 0 || _year % 400 == 0));
    }

    function _validDate(
        int32 _year,
        uint32 _month,
        uint32 _day
    ) private pure {
        require(_month > 0 && _month <= 12, "Month must be in [1, 12]");
        require(_day > 0 && _day <= 31, "Invalid day");
        if (_month == 2) {
            if (_isLeapYear(_year)) {
                require(_day <= 29, "Invalid day");
            } else {
                require(_day <= 28, "Invalid day");
            }
        }
        if ((_month < 8 && _month % 2 == 0) || (_month >= 8 && _month % 2 == 1)) {
            require(_day <= 30, "Invalid day");
        }
    }

    function _validTime(
        uint32 _hour,
        uint32 _minute,
        uint32 _second
    ) private pure {
        require(_hour < 24, "Invalid hour");
        require(_minute < 60, "Invalid minute");
        require(_second < 60, "Invalid second");
    }
}
