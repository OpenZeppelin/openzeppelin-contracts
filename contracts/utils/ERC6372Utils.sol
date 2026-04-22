// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {IERC6372} from "../interfaces/IERC6372.sol";
import {Time} from "./types/Time.sol";

/**
 * @dev Utility library for the ERC-6372 clock standard.
 */
library ERC6372Utils {
    /// @dev The clock was incorrectly modified.
    error ERC6372InconsistentClock();

    /// @dev Variant of {blockNumberClockMode-uint48-} that checks against an IERC6372 instance
    function blockNumberClockMode(IERC6372 instance) internal view returns (string memory) {
        return blockNumberClockMode(instance.clock());
    }

    /// @dev Variant of {blockNumberClockMode-uint48-} that checks against the clock function.
    function blockNumberClockMode(function() view returns (uint48) clock) internal view returns (string memory) {
        return blockNumberClockMode(clock());
    }

    /// @dev Block number clock mode. Checks that the current `clock` was not modified.
    function blockNumberClockMode(uint48 clock) internal view returns (string memory) {
        // Check that the clock was not modified
        if (clock != Time.blockNumber()) {
            revert ERC6372InconsistentClock();
        }
        return "mode=blocknumber&from=default";
    }

    /// @dev Variant of {timestampClockMode-uint48-} that checks against an IERC6372 instance
    function timestampClockMode(IERC6372 instance) internal view returns (string memory) {
        return timestampClockMode(instance.clock());
    }

    /// @dev Variant of {timestampClockMode-uint48-} that checks against the clock function.
    function timestampClockMode(function() view returns (uint48) clock) internal view returns (string memory) {
        return timestampClockMode(clock());
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
