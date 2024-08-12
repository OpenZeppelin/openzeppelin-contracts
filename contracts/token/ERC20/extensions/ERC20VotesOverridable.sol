// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/extensions/ERC20Votes.sol)

pragma solidity ^0.8.20;

import {ERC20} from "../ERC20.sol";
import {Votes} from "../../../governance/utils/Votes.sol";
import {Checkpoints} from "../../../utils/structs/Checkpoints.sol";
import {ERC20Votes} from "./ERC20Votes.sol";
import {ERC20SnapshotBalance} from "./ERC20SnapshotBalance.sol";
import {VotesSnapshotDelegates} from "../../../governance/utils/VotesSnapshotDelegates.sol";

abstract contract ERC20VotesOverridable is ERC20Votes, VotesSnapshotDelegates, ERC20SnapshotBalance {
    function _delegate(address account, address delegatee) internal override(Votes, VotesSnapshotDelegates) {
        super._delegate(account, delegatee);
    }

    function delegates(address account) public view override(Votes, VotesSnapshotDelegates) returns (address) {
        return super.delegates(account);
    }

    function _update(
        address from,
        address to,
        uint256 value
    ) internal virtual override(ERC20Votes, ERC20SnapshotBalance) {
        super._update(from, to, value);
    }

    function clock() public view virtual override(Votes, ERC20SnapshotBalance) returns (uint48) {
        super.clock();
    }
}
