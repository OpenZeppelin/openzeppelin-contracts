pragma solidity ^0.4.11;


import './StandardToken.sol';
import '../ownership/HasNoEther.sol';
import '../ownership/HasNoTokens.sol';
import '../ownership/HasNoContracts.sol';


/**
 * @title A safer version of StandardToken
 * @author SylTi
 * @dev token that reject ether, ERC23 token, and transfer to himself, and allow recovery of others tokens, ethers, or contracts when they are mistakenly transfered to it.
 * @dev this allow to recover from user error
 */
contract SaferStandardToken is StandardToken, HasNoEther, HasNoTokens, HasNoContracts {

  function transfer(address _to, uint256 _value) returns (bool) {
    require(_to != address(this));
    return super.transfer(_to, _value);
  }

  function transferFrom(address _from, address _to, uint256 _value) returns (bool) {
    require(_to != address(this));
    return super.transferFrom(_from, _to, _value);
  }

}