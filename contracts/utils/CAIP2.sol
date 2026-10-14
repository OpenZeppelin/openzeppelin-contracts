// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.2.0) (utils/CAIP2.sol)

pragma solidity ^0.8.24;

import {Bytes} from "./Bytes.sol";
import {Strings} from "./Strings.sol";

/**
 * @dev Helper library to format and parse CAIP-2 identifiers
 *
 * https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-2.md[CAIP-2] defines chain identifiers as:
 * chain_id:    namespace + ":" + reference
 * namespace:   [-a-z0-9]{3,8}
 * reference:   [-_a-zA-Z0-9]{1,32}
 *
 * WARNING: In some cases, multiple CAIP-2 identifiers may all be valid representation of a single chain.
 * For EVM chains, it is recommended to use `eip155:xxx` as the canonical representation (where `xxx` is
 * the EIP-155 chain id). Consider the possible ambiguity when processing CAIP-2 identifiers or when using them
 * in the context of hashes.
 */
library CAIP2 {
    using Strings for uint256;
    using Bytes for bytes;

    /// @dev Return the CAIP-2 identifier for the current (local) chain.
    function local() internal view returns (string memory) {
        return format("eip155", block.chainid.toString());
    }

    /**
     * @dev Return the CAIP-2 identifier for a given namespace and reference.
     *
     * NOTE: This function does not verify that the inputs are properly formatted.
     */
    function format(string memory namespace, string memory ref) internal pure returns (string memory) {
        return string.concat(namespace, ":", ref);
    }

    /**
     * @dev Parse a CAIP-2 identifier into its components.
     *
     * NOTE: This function does not verify that the CAIP-2 input is properly formatted.
     */
    function parse(string memory caip2) internal pure returns (string memory namespace, string memory ref) {
        bytes memory buffer = bytes(caip2);

        uint256 pos = buffer.indexOf(":");
        return (string(buffer.slice(0, pos)), string(buffer.slice(pos + 1)));
    }
}
