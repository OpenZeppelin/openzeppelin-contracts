// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../governance/utils/VotesUpgradeable.sol";
import "../proxy/utils/Initializable.sol";

contract VotesMockUpgradeable is Initializable, VotesUpgradeable {
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _owners;

    function __VotesMock_init(string memory name) internal onlyInitializing {
        __EIP712_init_unchained(name, "1");
    }

    function __VotesMock_init_unchained(string memory) internal onlyInitializing {}

    function getTotalSupply() public view returns (uint256) {
        return _getTotalSupply();
    }

    function delegate(address account, address newDelegation) public {
        return _delegate(account, newDelegation);
    }

    function _getVotingUnits(address account) internal virtual override returns (uint256) {
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

    /**
     * @dev This empty reserved space is put in place to allow future versions to add new
     * variables without shifting down storage in the inheritance chain.
     * See https://docs.openzeppelin.com/contracts/4.x/upgradeable#storage_gaps
     */
    uint256[48] private __gap;
}
