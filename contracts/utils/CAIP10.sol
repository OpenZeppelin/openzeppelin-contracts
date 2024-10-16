// SPDX-License-Identifier: MIT

pragma solidity ^0.8.24;

import {SafeCast} from "./math/SafeCast.sol";
import {Bytes} from "./Bytes.sol";
import {CAIP2} from "./CAIP2.sol";
import {Strings} from "./Strings.sol";

/**
 * @dev Helper library to format and parse CAIP-10 identifiers
 *
 * https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-10.md[CAIP-10] defines account identifiers as:
 * account_id:        chain_id + ":" + account_address
 * chain_id:          [-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32} (See {CAIP2})
 * account_address:   [-.%a-zA-Z0-9]{1,128}
 */
library CAIP10 {
    using SafeCast for uint256;
    using Strings for address;
    using Bytes for bytes;

    /// @dev Return the CAIP-10 identifier for an account on the current (local) chain.
    function local(address account) internal view returns (string memory) {
        return format(CAIP2.local(), account.toChecksumHexString());
    }

    /**
     * @dev Return the CAIP-10 identifier for a given caip2 chain and account.
     *
     * NOTE: This function does not verify that the inputs are properly formatted.
     */
    function format(string memory caip2, string memory account) internal pure returns (string memory) {
        return string.concat(caip2, ":", account);
    }

    /**
     * @dev Parse a CAIP-10 identifier into its components.
     *
     * NOTE: This function does not verify that the CAIP-10 input is properly formatted. The `caip2` return can be
     * parsed using the {CAIP2} library.
     */
    function parse(string memory caip10) internal pure returns (string memory caip2, string memory account) {
        bytes memory buffer = bytes(caip10);

        uint256 pos = buffer.lastIndexOf(":");
        return (string(buffer.slice(0, pos)), string(buffer.slice(pos + 1)));
    }
}
