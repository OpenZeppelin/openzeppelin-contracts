// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../Governor.sol";
import "../../token/ERC721/extensions/ERC721Votes.sol";
import "../../utils/math/Math.sol";

/**
 * @dev Extension of {Governor} for voting weight extraction from an {ERC2721Votes} token.
 *
 */
abstract contract GovernorERC721Votes is Governor {
    ERC721Votes public immutable token;

    constructor(ERC721Votes tokenAddress) {
        token = tokenAddress;
    }

    /**
     * Read the voting weight from the token's built in snapshot mechanism (see {IGovernor-getVotes}).
     */
     
    function getVotes(address account, uint256 blockNumber) public view virtual override returns (uint256) {
        return token.getVotingWeight(account, blockNumber);
    }
}
