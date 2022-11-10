// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/utils/EIP5805.sol";

contract EIP5805Mock is EIP5805 {
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _owners;

    constructor(string memory name) EIP712(name, "1") {}

    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function getTotalSupply() public view returns (uint256) {
        return _getTotalSupply();
    }

    function delegate(address account, address newDelegation) public {
        return _delegate(account, newDelegation);
    }

    function _getVotingUnits(address account) internal view override returns (uint256) {
        return _balances[account];
    }

    function mint(address account, uint256 voteId) external {
        _balances[account] += 1;
        _owners[voteId] = account;
        _transferVotingUnits(address(0), account, 1);
    }

    function burn(uint256 voteId) external {
        address owner = _owners[voteId];
        _balances[owner] -= 1;
        _transferVotingUnits(owner, address(0), 1);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
}
