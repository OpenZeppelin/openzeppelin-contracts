pragma solidity ^0.4.18;

import "./ERC20.sol";
import "./Mintable.sol";
import "../math/SafeMath.sol";
import "../ownership/Ownable.sol";

/**
 * @title PseudoMinter
 * @dev Proxy contract providing the necessary minting abbilities needed
 * within crowdsale contracts to ERC20 token contracts with a pre minted
 * fixed amount of tokens.
 * PseudoMinter is initialized with the token contract and the vault contract
 * which provides the spendable tokens. Cap is automatically set by approving
 * to the PseudoMinter instance the chosen amount of tokens.  Be aware that
 * this does not necessarily represent the hard cap of spendable tokens. If
 * vault can arbitrarily call the tokens approve function, this might even
 * be a security risk since the cap can be manipulated at will. Best practice
 * is to design vault as a contract with limited ablity to call the tokens
 * approve function.
 * For an example implementation see contracts/example/PreMintedCrowdsale.sol
 */
contract PseudoMinter is Mintable, Ownable {
  using SafeMath for uint256;

  // The token being sold
  ERC20 public token;
  // address which provides tokens via token.approve(...) function
  address public vault;
  // amount of tokens which have been pseudo minted
  uint256 public tokensMinted;

  function PseudoMinter(ERC20 _token, address _vault) public {
    require(address(_token) != 0x0);
    require(_vault != 0x0);

    token = _token;
    vault = _vault;
  }

  /**
   * @dev Function to pseudo mint tokens, once the approved amount is used,
   *      cap is automatically reached.
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(address _to, uint256 _amount) onlyOwner public returns (bool) {
    tokensMinted.add(_amount);
    token.transferFrom(vault, _to, _amount);
    return true;
  }

  /**
   * @dev returns amount of tokens that can be pseudo minted. Be aware that
   * this does not necessarily represent the hard cap of spendable tokens!
   */
  function availableSupply() public constant returns (uint256) {
    return token.allowance(vault, this);
  }
}
