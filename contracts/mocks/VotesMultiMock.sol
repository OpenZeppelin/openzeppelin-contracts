// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/utils/VotesMulti.sol";

contract VotesMultiMock is VotesMulti {
    mapping(address => mapping(uint256 => uint256)) private _balances;
    mapping(uint256 => mapping(uint256 => address)) private _owners;

    constructor(string memory name) EIP712(name, "1") {}

    function getTotalSupply(uint256 id) public view returns (uint256) {
        return _getTotalSupply(id);
    }

    function delegate(
        address account,
        uint256 id,
        address newDelegation
    ) public {
        return _delegate(account, id, newDelegation);
    }

    function _getVotingUnits(address account, uint256 id) internal view override returns (uint256) {
        return _balances[account][id];
    }

    function mint(
        address account,
        uint256 id,
        uint256 voteId,
        bytes calldata
    ) external {
        _balances[account][id] += 1;
        _owners[id][voteId] = account;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1;
        _transferVotingUnits(address(0), account, ids, amounts);
    }

    function burn(
        address,
        uint256 id,
        uint256 voteId
    ) external {
        address owner = _owners[id][voteId];
        _balances[owner][id] -= 1;
        uint256[] memory ids = new uint256[](1);
        ids[0] = id;
        uint256[] memory amounts = new uint256[](1);
        amounts[0] = 1;
        _transferVotingUnits(owner, address(0), ids, amounts);
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }
}
