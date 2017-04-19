pragma solidity ^0.4.8;


import './StandardToken.sol';
import '../ownership/Ownable.sol';



/**
 * Mintable token
 *
 * Simple ERC20 Token example, with mintable token creation
 * Issue:
 * https://github.com/OpenZeppelin/zeppelin-solidity/issues/120
 * Based on code by TokenMarketNet:
 * https://github.com/TokenMarketNet/ico/blob/master/contracts/MintableToken.sol
 */

contract MintableToken is StandardToken, Ownable {
  event Mint(address indexed to, uint value);
  event MintFinished();

  bool public mintingFinished = false;
  uint public totalSupply = 0;

  modifier canMint() {
    if(mintingFinished) throw;
    _;
  }

  function mint(address _to, uint _amount) onlyOwner canMint returns (bool) {
    totalSupply = totalSupply.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    Mint(_to, _amount);
    return true;
  }

  function finishMinting() onlyOwner returns (bool) {
    mintingFinished = true;
    MintFinished();
    return true;
  }
}
