pragma solidity ^0.5.0;

/**
 * @title Provides generic functionality for a TimeFrame.
 * @author Sam Ruberti <sam@GRAFFT.io>
 * @dev This library provides useful methods for governing a start and an end time.
 *
 * WARNING: This should NOT be used for contracts that depend on time for an outcome where a miner can benefit.
 * One example would be a lottery where the first submission of an answer to a problem is rewarded. In this case the
 * contract would be vulnerable to malicious miners who could read the answer of a not-yet-mined transaction then
 * substitute their own answer in a new transaction before the victim's transaction, stealing the reward in the process.
 * The miner could steal the reward.
 *
 * SAFE USE: TimeFrame CAN be used for approximate times that govern periods when methods and actions may occur.
 * An example is an escrow that contains a start and expiration date. You can read about timestamp security
 * vulnerabilities here:
 * github.com/ethereumbook/ethereumbook/blob/develop/09smart-contracts-security.asciidoc#block-timestamp-manipulation
 */


/* solhint-disable not-rely-on-time, security/no-block-members */
library TimeFrame {
    struct Epoch {
        uint256 start;
        uint256 end;
    }

    function hasStarted(Epoch storage epoch) internal view returns (bool){
        return now >= epoch.start;
    }

    function isActive(Epoch storage epoch) internal view returns (bool) {
        return now >= epoch.start && now <= epoch.end;
    }

    function hasEnded(Epoch storage epoch) internal view returns (bool) {
        return now > epoch.end;
    }

    function timeUntilStart(Epoch storage epoch) internal view returns (uint256){
        require(now <= epoch.start, "Already started");
        return epoch.start - now;
    }

    function elapsedSinceStart(Epoch storage epoch) internal view returns (uint256){
        require(now >= epoch.start, "Not started");
        return now - epoch.start;
    }

    function timeUntilEnd(Epoch storage epoch) internal view returns (uint256){
        require(now <= epoch.end, "Already ended");
        return epoch.end - now;
    }

    function elapsedSinceEnd(Epoch storage epoch) internal view returns (uint256){
        require(now > epoch.end, "Not ended");
        return now - epoch.end;
    }

    function length(Epoch storage epoch) internal view returns (uint256){
        require(epoch.start <= epoch.end, "Invalid start and end dates");
        return epoch.end - epoch.start;
    }

    function terminate(Epoch storage epoch) internal {
        require(now <= epoch.end, "Epoch has already ended");
        epoch.end = now - 1;
    }
}
/* solhint-enable not-rely-on-time, security/no-block-members */
