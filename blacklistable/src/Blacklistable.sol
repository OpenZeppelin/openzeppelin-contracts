// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.2.0) (utils/Blacklistable.sol)
pragma solidity ^0.8.20;

import {Ownable} from "../../contracts/access/Ownable.sol";
import "../../contracts/utils/Strings.sol";

/**
 * @title Blacklistable
 * @dev Allows addresses to be blacklisted by a contract owner
 * @notice In order for this to work like an actual blacklist, you need to add the following to your _update function in the implementation contract before super._update:
 * // Check blacklist status before executing transfer
 * if (from != address(0) && to != address(0)) {
 * 	_checkBlacklist(from, to);
 * }
 */
abstract contract Blacklistable is Ownable {
	mapping(address => bool) private _blacklisted;
	bool private _eventsEnabled = true;
	
	event BlacklistUpdated(address indexed account, bool isBlacklisted);

	/**
	 * @dev Enables events
	 */
	function _enableEvents() external onlyOwner {
		_eventsEnabled = true;
	}

	/**
	 * @dev Disables events
	 */
	function _disableEvents() external onlyOwner {
		_eventsEnabled = false;
	}
	
	/**
	 * @dev Checks if an account is blacklisted
	 * @param account The address to check
	 */
	function isBlacklisted(address account) public view returns (bool) {
		return _blacklisted[account];
	}
	
	/**
	 * @dev Adds an address to the blacklist
	 * @param account The address to blacklist
	 */
	function addToBlacklist(address account) external onlyOwner {
		require(account != address(0), "Blacklistable: invalid address");
		require(!_blacklisted[account], "Blacklistable: account already blacklisted");
		
		_blacklisted[account] = true;
		if (_eventsEnabled) {
			emit BlacklistUpdated(account, true);
		}
	}
	
	/**
	 * @dev Removes an address from the blacklist
	 * @param account The address to remove from the blacklist
	 */
	function removeFromBlacklist(address account) external onlyOwner {
		require(account != address(0), "Blacklistable: invalid address");
		require(_blacklisted[account], "Blacklistable: account not blacklisted");
		
		_blacklisted[account] = false;
		if (_eventsEnabled) {
			emit BlacklistUpdated(account, false);
		}
	}
	
	/**
	 * @dev Adds multiple addresses to the blacklist
	 * @param accounts Array of addresses to blacklist
	 */
	function batchBlacklist(address[] calldata accounts, bool blacklisted) external onlyOwner {
		require(accounts.length > 0, "Blacklistable: empty accounts array");
		
		for (uint256 i = 0; i < accounts.length; i++) {
			require(accounts[i] != address(0), string(abi.encodePacked("Blacklistable: invalid address in array at index ", Strings.toString(i))));
			if (_blacklisted[accounts[i]] != blacklisted) {
				_blacklisted[accounts[i]] = blacklisted;
				if (_eventsEnabled) {
					emit BlacklistUpdated(accounts[i], blacklisted);
				}
			}
		}
	}
	
	/**
	 * @dev Modifier to make a function callable only when the caller is not blacklisted
	 */
	modifier notBlacklisted(address account) {
		require(!_blacklisted[account], "Blacklistable: account is blacklisted");
		_;
	}
	
	/**
	 * @dev Ensures neither the sender nor recipient is blacklisted
	 */
	function _checkBlacklist(address from, address to) internal view {
		require(!_blacklisted[from], "Blacklistable: sender is blacklisted");
		require(!_blacklisted[to], "Blacklistable: recipient is blacklisted");
	}
}