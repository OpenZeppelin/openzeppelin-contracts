// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20Votes} from "../../token/ERC20/extensions/ERC20Votes.sol";
import {VotesExtended, Votes} from "../../governance/utils/VotesExtended.sol";
import {SafeCast} from "../../utils/math/SafeCast.sol";

abstract contract ERC20VotesExtendedMock is ERC20Votes, VotesExtended {
    function _delegate(address account, address delegatee) internal virtual override(Votes, VotesExtended) {
        return super._delegate(account, delegatee);
    }

    function _transferVotingUnits(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(Votes, VotesExtended) {
        return super._transferVotingUnits(from, to, amount);
    }
}

abstract contract ERC20VotesExtendedTimestampMock is ERC20VotesExtendedMock {
    function clock() public view virtual override returns (uint48) {
        return SafeCast.toUint48(block.timestamp);
    }

    // solhint-disable-next-line func-name-mixedcase
    function CLOCK_MODE() public view virtual override returns (string memory) {
        return "mode=timestamp";
    }
}
