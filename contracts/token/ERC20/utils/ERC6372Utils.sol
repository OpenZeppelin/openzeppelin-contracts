// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {Time} from "../../../utils/types/Time.sol";

/**
 * @dev Utility library for the ERC-6372 clock standard.
 */
library ERC6372Utils {
    /// @dev The clock was incorrectly modified.
    error ERC6372InconsistentClock();

    /// @dev Block number clock mode. Checks that the current `clock` was not modified.
    function blockNumberClockMode(uint48 clock) internal view returns (string memory) {
        // Check that the clock was not modified
        if (clock != Time.blockNumber()) {
            revert ERC6372InconsistentClock();
        }
        return "mode=blocknumber&from=default";
    }

    /// @dev Timestamp clock mode. Checks that the current `clock` was not modified.
    function timestampClockMode(uint48 clock) internal view returns (string memory) {
        // Check that the clock was not modified
        if (clock != Time.timestamp()) {
            revert ERC6372InconsistentClock();
        }
        return "mode=timestamp";
    }
}
