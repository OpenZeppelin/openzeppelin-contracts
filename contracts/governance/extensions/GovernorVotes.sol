// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (governance/extensions/GovernorVotes.sol)

pragma solidity ^0.8.20;

import {Governor} from "../Governor.sol";
import {IVotes} from "../utils/IVotes.sol";
import {IERC5805} from "../../interfaces/IERC5805.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";
import {Time} from "../../utils/types/Time.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from an {ERC20Votes} token, or since v4.5 an {ERC721Votes}
 * token.
 */
abstract contract GovernorVotes is Governor {
    IERC5805 private immutable _token;

    constructor(IVotes tokenAddress) {
        _token = IERC5805(address(tokenAddress));
    }

    /**
     * @dev The token that voting power is sourced from.
     */
    function token() public view virtual returns (IERC5805) {
        return _token;
    }

    /**
     * @dev Clock (as specified in ERC-6372) is set to match the token's clock. Fallback to block numbers if the token
     * does not implement ERC-6372.
     */
    function clock() public view virtual override returns (uint48) {
        try token().clock() returns (uint48 timepoint) {
            return timepoint;
        } catch {
            return Time.blockNumber();
        }
    }

    /**
     * @dev Machine-readable description of the clock as specified in ERC-6372.
     */
    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view virtual override returns (string memory) {
        try token().CLOCK_MODE() returns (string memory clockmode) {
            return clockmode;
        } catch {
            return "mode=blocknumber&from=default";
        }
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {Governor-_getVotes}).
     */
    function _getVotes(
        address account,
        uint256 timepoint,
        bytes memory /*params*/
    ) internal view virtual override returns (uint256) {
        return token().getPastVotes(account, timepoint);
    }
}
