pragma solidity ^0.4.24;

import "./ERC20Mintable.sol";


/**
 * @title Capped token
 * @dev Mintable token with a token cap.
 */
contract ERC20Capped is ERC20Mintable {

  uint256 private cap_;

  constructor(uint256 _cap) public {
    require(_cap > 0);
    cap_ = _cap;
  }

  /**
   * @return the cap for the token minting.
   */
  function cap() public view returns(uint256) {
    return cap_;
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address _to,
    uint256 _amount
  )
    public
    returns (bool)
  {
    require(totalSupply().add(_amount) <= cap_);

    return super.mint(_to, _amount);
  }

}
