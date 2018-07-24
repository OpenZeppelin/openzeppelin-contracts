pragma solidity ^0.4.24;
import "./StandardToken.sol";
import "../../ownership/Ownable.sol";
import "./ERC20.sol";
import "../../AddressUtils.sol";

/**
 * @title Recoverable token
 * @dev StandardToken modified with recover transfer of other erc20 token.
 **/
contract RecoverableToken is StandardToken, Ownable {

  /**
   * @dev Recover other tokens transferred to this contract
   * @param _token address The address of the other contract
   */
  function recoverToken(address _token) public onlyOwner returns (bool) {

    require(isContract(_token));
    ERC20 token = ERC20(_token);
    uint256 balance = token.balanceOf(address(this));
    token.transfer(owner, balance);
    return true;

  }

}
