pragma solidity ^0.4.24;

import "./ERC777Base.sol";


/**
 * @title ERC777 token implementation
 * @notice mint an amount of tokens given to msg.sender
 * @author Bertrand Masius <github@catageeks.tk>
 * @dev see https://github.com/ethereum/EIPs/blob/master/EIPS/eip-777.md
 */
contract ERC777 is ERC777Base {
/*
 * @dev constructor
 * @param name name of the token
 * @param symbol symbol of the token
 * @param granularity granularity of token
 * @param defaultOperators array of default operators address
 * @param initialSupply amount of tokens given to msg.sender
 * @param data bytes information attached to the send, and intended for the recipient (to)
 * @param operatorData bytes extra information provided by the operator (if any)
 */
  constructor(
    string name,
    string symbol,
    uint256 granularity,
    address[] defaultOperators,
    uint256 initialSupply,
    bytes data,
    bytes operatorData
  )
  ERC777Base(
    name,
    symbol,
    granularity,
    defaultOperators
  ) public {
    _mint(msg.sender, msg.sender, initialSupply, data, operatorData);
  }
}
