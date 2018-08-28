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
  function recoverToken(ERC20 _token) public onlyOwner {

    require(AddressUtils.isContract(_token));
    uint256 balance = _token.balanceOf(address(this));
    _token.transfer(owner, balance);

  }

}
