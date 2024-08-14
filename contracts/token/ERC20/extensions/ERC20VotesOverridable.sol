// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC20Votes.sol)

pragma solidity ^0.8.20;

import {ERC20} from "../ERC20.sol";
import {Votes} from "../../../governance/utils/Votes.sol";
import {Checkpoints} from "../../../utils/structs/Checkpoints.sol";
import {ERC20Votes} from "./ERC20Votes.sol";
import {VotesOverridable} from "../../../governance/utils/VotesOverridable.sol";

abstract contract ERC20VotesOverridable is ERC20Votes, VotesOverridable {
    function _delegate(address account, address delegatee) internal override(Votes, VotesOverridable) {
        super._delegate(account, delegatee);
    }

    function _transferVotingUnits(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(Votes, VotesOverridable) {
        super._transferVotingUnits(from, to, amount);
    }

    function delegates(address delegatee) public view override(Votes, VotesOverridable) returns (address) {
        return super.delegates(delegatee);
    }
}
