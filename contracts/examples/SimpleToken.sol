pragma solidity ^0.4.24;


import "zos-lib/contracts/Initializable.sol";
import "../token/ERC20/ERC20.sol";


/**
 * @title SimpleToken
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `ERC20` functions.
 */
contract SimpleToken is Initializable, ERC20 {

  string public constant name = "SimpleToken";
  string public constant symbol = "SIM";
  uint8 public constant decimals = 18;

  uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(decimals));

  /**
   * @dev Constructor that gives sender all of existing tokens.
   */
  function initialize(address sender) public initializer {
    _mint(sender, INITIAL_SUPPLY);
  }


  uint256[50] private ______gap;
}
