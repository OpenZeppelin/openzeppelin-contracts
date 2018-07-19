pragma solidity ^0.4.24;

import "../token/ERC20/ERC20.sol";
import "../token/ERC20/MigratableERC20.sol";

/**
 * @title MigratedERC20Mock
 * @dev This contract is a mock to test how a token could be migrated using the MigratableERC20 contract
 */
contract MigratedERC20Mock is MigratableERC20, ERC20 {

  constructor(ERC20 _legacyToken) MigratableERC20(_legacyToken) public {}

}
