pragma solidity ^0.4.24;

import "./IERC777.sol";
import "../../math/SafeMath.sol";

contract ERC777 is IERC777 {
  using SafeMath for uint256;

  string private _name;

  string private _symbol;

  mapping(address => uint256) private _balances;

  uint256 private _totalSupply;

  uint256 private _granularity;

  address[] private _defaultOperatorsArray;

  constructor(string name, string symbol, uint256 granularity, address[] defaultOperators) public {
    require(granularity > 0);
    _name = name;
    _symbol = symbol;
    _defaultOperatorsArray = defaultOperators;
  }

  /**
   * @return the name of the token.
   */
  function name() public view returns (string) {
    return _name;
  }

  /**
   * @return the symbol of the token.
   */
  function symbol() public view returns (string) {
    return _symbol;
  }

  /**
  * @dev Total number of tokens in existence
  */
  function totalSupply() public view returns (uint256) {
    return _totalSupply;
  }

  /**
  * @dev Gets the balance of the specified address.
  * @param tokenHolder The address to query the balance of.
  * @return uint256 representing the amount owned by the specified address.
  */
  function balanceOf(address tokenHolder) public view returns (uint256) {
    return _balances[tokenHolder];
  }

  /**
  * @dev Gets the token's granularity,
  * i.e. the smallest number of tokens (in the basic unit) which may be minted, sent or burned at any time
  * @return uint256 granularity
  */
  function granularity() public view returns (uint256) {
    return _granularity;
  }

  /**
  * @dev Get the list of default operators as defined by the token contract.
  * @return address[] default operators
  */
  function defaultOperators() public view returns (address[]) {
    return _defaultOperatorsArray;
  }
}
