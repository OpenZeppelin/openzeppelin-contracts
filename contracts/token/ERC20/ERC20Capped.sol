pragma solidity ^0.4.24;

import "zos-lib/contracts/Initializable.sol";
import "./ERC20Mintable.sol";


/**
 * @title Capped token
 * @dev Mintable token with a token cap.
 */
contract ERC20Capped is Initializable, ERC20Mintable {

  uint256 private _cap;

  function initialize(uint256 cap, address sender)
    public
    initializer
  {
    ERC20Mintable.initialize(sender);

    require(cap > 0);
    _cap = cap;
  }

  /**
   * @return the cap for the token minting.
   */
  function cap() public view returns(uint256) {
    return _cap;
  }

  /**
   * @dev Function to mint tokens
   * @param to The address that will receive the minted tokens.
   * @param amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address to,
    uint256 amount
  )
    public
    returns (bool)
  {
    require(totalSupply().add(amount) <= _cap);

    return super.mint(to, amount);
  }


  uint256[50] private ______gap;
}
