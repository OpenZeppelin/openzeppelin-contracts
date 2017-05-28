pragma solidity ^0.4.8;


import "./StandardToken.sol";
import "../ownership/Ownable.sol";


/**
 * @title CrowdsaleToken
 *
 * @dev Simple ERC20 Token example, with crowdsale token creation
 * @dev IMPORTANT NOTE: do not use or deploy this contract as-is. It needs some changes to be
 * production ready.
 */
contract CrowdsaleToken is StandardToken, Ownable {

  string public constant name = "CrowdsaleToken";
  string public constant symbol = "CRW";
  uint public constant decimals = 18;

  // replace with your fund collection multisig address
  address public constant multisig = 0x0;

  // 1 ether = 500 example tokens
  uint public constant PRICE = 500;

  /**
   * @dev Fallback function which receives ether and sends the appropriate number of tokens to the
   * msg.sender.
   */
  function () payable {
    buyTokens();
  }

  /**
   * @dev Creates tokens and send to the message sender.
   */
  function buyTokens() payable {
    if (msg.value == 0) {
      throw;
    }

    uint tokens = msg.value.mul(getPrice());
    totalSupply = totalSupply.add(tokens);
    balances[msg.sender] = balances[msg.sender].add(tokens);
  }

  /**
   * @dev Withdraw funding money and send to multisig address
   */
   function withdraw() onlyOwner {
     if (!multisig.send(msg.value)) {
       throw;
     }
   }

  /**
   * @dev replace this with any other price function
   * @return The price per unit of token.
   */
  function getPrice() constant returns (uint result) {
    return PRICE;
  }
}
