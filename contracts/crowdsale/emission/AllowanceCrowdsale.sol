pragma solidity ^0.4.24;

import "../Crowdsale.sol";
import "../../token/ERC20/IERC20.sol";
import "../../token/ERC20/SafeERC20.sol";
import "../../math/SafeMath.sol";


/**
 * @title AllowanceCrowdsale
 * @dev Extension of Crowdsale where tokens are held by a wallet, which approves an allowance to the crowdsale.
 */
contract AllowanceCrowdsale is Crowdsale {
  using SafeMath for uint256;
  using SafeERC20 for IERC20;

  address private tokenWallet_;

  /**
   * @dev Constructor, takes token wallet address.
   * @param _tokenWallet Address holding the tokens, which has approved allowance to the crowdsale
   */
  constructor(address _tokenWallet) public {
    require(_tokenWallet != address(0));
    tokenWallet_ = _tokenWallet;
  }

  /**
   * @return the address of the wallet that will hold the tokens.
   */
  function tokenWallet() public view returns(address) {
    return tokenWallet_;
  }

  /**
   * @dev Checks the amount of tokens left in the allowance.
   * @return Amount of tokens left in the allowance
   */
  function remainingTokens() public view returns (uint256) {
    return token().allowance(tokenWallet_, this);
  }

  /**
   * @dev Overrides parent behavior by transferring tokens from wallet.
   * @param _beneficiary Token purchaser
   * @param _tokenAmount Amount of tokens purchased
   */
  function _deliverTokens(
    address _beneficiary,
    uint256 _tokenAmount
  )
    internal
  {
    token().safeTransferFrom(tokenWallet_, _beneficiary, _tokenAmount);
  }
}
