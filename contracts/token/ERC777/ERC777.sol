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

  address[] private _defaultOpsArray;
  mapping(address => bool) _defaultOps;
  mapping(address => mapping(address => bool)) _revokedDefaultOps;
  mapping(address => mapping(address => bool)) _ops;

  constructor(
    string name,
    string symbol,
    uint256 granularity,
    address[] defaultOperators
  ) public {
    require(granularity > 0);
    _name = name;
    _symbol = symbol;
    _granularity = granularity;
    _defaultOpsArray = defaultOperators;
    for (uint i = 0; i < defaultOperators.length; i++) {
      _defaultOps[defaultOperators[i]] = true;
    }
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
  * i.e. the smallest number of tokens (in the basic unit)
  * which may be minted, sent or burned at any time
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
    return _defaultOpsArray;
  }

  /**
   * @dev Authorize an operator for the sender
   * @param operator address to be authorized as operator
   */
  function authorizeOperator(address operator) public {
    require(!isOperatorFor(operator, msg.sender));
    if (_defaultOps[operator]) {
      _reAuthorizeDefaultOperator(operator);
    } else _authorizeOperator(operator);
  }

  /**
   * @dev Revoke operator rights from one of the default operators
   * @param operator address to revoke operator rights from
   */
  function revokeOperator(address operator) public {
    require(operator != msg.sender);
    require(isOperatorFor(operator, msg.sender));

    if (_defaultOps[operator]) {
      _revokeDefaultOperator(operator);
    } else _revokeOperator(operator);
  }

  /**
   * @dev Indicate whether an address
   * is an operator of the tokenHolder address
   * @param operator address which may be an operator of tokenHolder
   * @param tokenHolder address of a token holder which may have the operator
   * address as an operator.
   */
  function isOperatorFor(
    address operator,
    address tokenHolder
  ) public view returns (bool) {
    return
    operator == tokenHolder ||
    _defaultOps[operator] && !_revokedDefaultOps[tokenHolder][operator] ||
    _ops[tokenHolder][operator];
  }



  /**
   * @dev Authorize an operator for the sender
   * @param operator address to be authorized as operator
   */
  function _authorizeOperator(address operator) internal {
    _ops[msg.sender][operator] = true;
    emit AuthorizedOperator(operator, msg.sender);
  }

  /**
   * @dev Re-authorize a previously revoked default operator
   * @param operator address to be re-authorized as operator
   */
  function _reAuthorizeDefaultOperator(address operator) internal {
    delete _revokedDefaultOps[msg.sender][operator];
    emit AuthorizedOperator(operator, msg.sender);
  }

  /**
   * @dev Revoke operator rights from one of the default operators
   * @param operator address to revoke operator rights from
   */
  function _revokeDefaultOperator(address operator) internal {
    _revokedDefaultOps[msg.sender][operator] = true;
    emit RevokedOperator(operator, msg.sender);
  }

  /**
   * @dev Revoke an operator for the sender
   * @param operator address to revoke operator rights from
   */
  function _revokeOperator(address operator) internal {
    delete _ops[msg.sender][operator];
    emit RevokedOperator(operator, msg.sender);
  }

  function send(address to, uint256 amount, bytes data) external {} //TODO

  function operatorSend(address from, address to, uint256 amount, bytes data, bytes operatorData) external {} //TODO

  function burn(uint256 amount, bytes data) external {} //TODO

  function operatorBurn(address from, uint256 amount, bytes data, bytes operatorData) external {} //TODO
}
