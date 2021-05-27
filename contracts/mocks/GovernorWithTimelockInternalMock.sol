// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/IComp.sol";
import "../governance/extensions/GovernorWithToken.sol";
import "../governance/extensions/GovernorWithTimelockInternal.sol";

contract GovernorWithTimelockInternalMock is GovernorWithToken, GovernorWithTimelockInternal {
    constructor(string memory name_, string memory version_, IComp token_, uint256 delay_)
    EIP712(name_, version_)
    GovernorWithToken(token_)
    GovernorWithTimelockInternal(delay_)
    {
    }

    receive() external payable {}

    function votingDuration() public pure override returns (uint256) { return 7 days; } // FOR TESTING ONLY
    function maxScore()       public pure override returns (uint8)   { return 100;    } // default: 255 ?
    function requiredScore()  public pure override returns (uint8)   { return 50;     } // default: 128 ?
    function quorum(uint256)  public pure override returns (uint256) { return 1;      }

    function cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 salt
    ) public returns (uint256 proposalId) {
        return _cancel(targets, values, calldatas, salt);
    }

    function _calls(uint256 proposalId, address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 salt)
    internal virtual override(Governor, GovernorWithTimelockInternal)
    { super._calls(proposalId, targets, values, calldatas, salt); }

    function _cancel(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 salt)
    internal virtual override(Governor, GovernorWithTimelockInternal) returns (uint256 proposalId)
    { return super._cancel(targets, values, calldatas, salt); }

    function execute(address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 salt)
    public payable virtual override(Governor, GovernorWithTimelockInternal) returns (uint256 proposalId)
    { return super.execute(targets, values, calldatas, salt); }

    function state(uint256 proposalId)
    public view virtual override(Governor, GovernorWithTimelockInternal) returns (ProposalState)
    { return super.state(proposalId); }
}
