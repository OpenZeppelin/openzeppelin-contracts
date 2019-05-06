pragma solidity ^0.5.2;

/**
 * @title Provides generic functionality for a TimeFrame.
 * @author Sam Ruberti <sam@GRAFFT.io>
 * @dev This library provides useful methods for governing a start and an end time.
 *
 * WARNING: This should NOT be used for contracts that depend on time for an outcome where a miner can benefit.
 * One example would be a lottery where the first submission of an answer to a problem is rewarded. In this case the
 * contract would be vulnerable to malicious miners who could read the answer of a not-yet-mined transaction then
 * substitute their own answer in a new transaction before the victim's transaction, stealing the reward in the process.
 *
 * SAFE USE: TimeFrame CAN be used for approximate times that govern periods when methods and actions may occur.  The time window should not be too narrow, however (i.e. at least a minute), due to block times and the potential for miner timestamp manipulation.

 * An example is an escrow that contains a start and expiration date. You can read about timestamp security
 * vulnerabilities here:
 * https://github.com/ethereumbook/ethereumbook/blob/first_edition_first_print/09smart-contracts-security.asciidoc#block-timestamp-manipulation
 *
 * IMPORTANT I emphasize that the time windows is not too narrow (e.g. a couple of seconds)
 */


/* solhint-disable not-rely-on-time*/
library TimeFrame {
    struct Epoch {
        uint256 _start;
        uint256 _end;
    }

    function create(uint256 start, uint256 end) internal pure returns (Epoch memory) {
        require(end > start);
        require(end > start + 60);
        return Epoch(start, end);
    }

    function hasStarted(Epoch storage epoch) internal view returns (bool) {
        return now >= epoch._start;
    }

    function isActive(Epoch storage epoch) internal view returns (bool) {
        return now >= epoch._start && now <= epoch._end;
    }

    function hasEnded(Epoch storage epoch) internal view returns (bool) {
        return now > epoch._end;
    }

    function timeUntilStart(Epoch storage epoch) internal view returns (uint256) {
        require(now < epoch._start);
        return epoch._start - now;
    }

    function elapsedSinceStart(Epoch storage epoch) internal view returns (uint256) {
        require(now >= epoch._start);
        return now - epoch._start;
    }

    function timeUntilEnd(Epoch storage epoch) internal view returns (uint256) {
        require(now <= epoch._end);
        return epoch._end - now;
    }

    function elapsedSinceEnd(Epoch storage epoch) internal view returns (uint256) {
        require(now > epoch._end);
        return now - epoch._end;
    }

    function length(Epoch storage epoch) internal view returns (uint256) {
        require(epoch._start <= epoch._end);
        return epoch._end - epoch._start;
    }

    function terminate(Epoch storage epoch) internal {
        require(now <= epoch._end);
        epoch._end = now - 1;
    }
}
