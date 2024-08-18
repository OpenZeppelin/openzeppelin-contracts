// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20Votes, ERC20} from "../../token/ERC20/extensions/ERC20Votes.sol";
import {VotesOverridable, Votes} from "../../governance/utils/VotesOverridable.sol";
import {EIP712} from "../../utils/cryptography/EIP712.sol";

contract ERC20VotesOverridableMock is ERC20Votes, VotesOverridable {
    constructor() ERC20("ERC20VotesOverridableMock", "E20M") EIP712("ERC20VotesOverridableMock", "1.0.0") {}

    function mint(address account, uint256 amount) external {
        _mint(account, amount);
    }

    function burn(address account, uint256 amount) external {
        _burn(account, amount);
    }

    function _delegate(address account, address delegatee) internal virtual override(Votes, VotesOverridable) {
        return super._delegate(account, delegatee);
    }

    function _transferVotingUnits(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(Votes, VotesOverridable) {
        return super._transferVotingUnits(from, to, amount);
    }

    function delegates(address delegatee) public view virtual override(Votes, VotesOverridable) returns (address) {
        return super.delegates(delegatee);
    }
}
