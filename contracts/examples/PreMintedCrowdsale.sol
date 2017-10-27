pragma solidity ^0.4.11;

import "../token/PseudoMinter.sol";
import "../crowdsale/Crowdsale.sol";
import "./SimpleToken.sol";

/**
 * @title PreMintedCrowdsaleVault
 * @dev Simple contract which acts as a vault for the pre minted tokens to be
 * sold during crowdsale. The tokens approve function is limited to one call
 * which makes the PreMintedCrowdsale to a capped crowdsale.
 */
contract PreMintedCrowdsaleVault {

  SimpleToken public token;
  PreMintedCrowdsale public crowdsale;

  function PreMintedCrowdsaleVault(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet) {
    token = new SimpleToken();
    crowdsale = new PreMintedCrowdsale(_startTime, _endTime, _rate, _wallet, token);
    
    PseudoMinter _pseudoMinter = PseudoMinter(crowdsale.token());
    token.approve(_pseudoMinter, token.balanceOf(this));
  }
}

/**
 * @title PreMintedCrowdsale
 * @dev This is an example of a crowdsale which has had its tokens already minted
 * in advance. By storing the spendable tokens in the PreMintedCrowdsaleVault
 * and limiting the call to the tokens approve function, the crowdsale supports a
 * definite hard cap.
 */
contract PreMintedCrowdsale is Crowdsale {

  function PreMintedCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet, ERC20 _token)
    Crowdsale(_startTime, _endTime, _rate, _wallet)
  {
    token = new PseudoMinter(_token, msg.sender);
  }

  // return address zero since Mintable is created in the constructor above
  function createMintableContract() internal returns (Mintable) {
    return Mintable(0x0);
  }

  // @return true if crowdsale event has ended
  function hasEnded() public constant returns (bool) {
    bool capReached = PseudoMinter(token).availableSupply() < rate;
    return super.hasEnded() || capReached;
  }
}
