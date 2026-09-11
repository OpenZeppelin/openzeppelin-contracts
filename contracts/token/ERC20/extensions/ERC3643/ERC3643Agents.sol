// SPDX-License-Identifier: MIT

pragma solidity ^0.8.26;

import {IAgentRole} from "../../../../interfaces/IERC3643.sol";
import {Ownable} from "../../../../access/Ownable.sol";

abstract contract ERC3643Agents is IAgentRole, Ownable {
    mapping(address => bool) private _agents;

    /// @dev The account is not an agent.
    error ERC3643NotAgent(address account);

    /// @dev Throws if the account is not an agent.
    modifier onlyAgent() {
        _checkAgent(_msgSender());
        _;
    }

    /// @inheritdoc IAgentRole
    function addAgent(address account) public virtual onlyOwner {
        _addAgent(account);
    }

    /// @inheritdoc IAgentRole
    function removeAgent(address account) public virtual onlyOwner {
        _removeAgent(account);
    }

    /// @inheritdoc IAgentRole
    function isAgent(address account) public view virtual returns (bool) {
        return _agents[account];
    }

    /// @dev Adds an agent to the contract. No-op if already an agent.
    function _addAgent(address agent) internal virtual {
        if (!isAgent(agent)) {
            _agents[agent] = true;
            emit AgentAdded(agent);
        } // no-op if already an agent
    }

    /// @dev Removes an agent from the contract. No-op if not an agent.
    function _removeAgent(address agent) internal virtual {
        if (isAgent(agent)) {
            _agents[agent] = false;
            emit AgentRemoved(agent);
        } // no-op if not an agent
    }

    /// @dev Throws if the account is not an agent.
    function _checkAgent(address account) internal view virtual {
        require(isAgent(account), ERC3643NotAgent(account));
    }
}
