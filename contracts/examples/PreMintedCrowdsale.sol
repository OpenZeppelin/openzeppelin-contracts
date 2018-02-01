pragma solidity ^0.4.18;

import "../token/ERC20/PseudoMinter.sol";
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

  function PreMintedCrowdsaleVault(
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet
  ) public {
    token = new SimpleToken();
    PseudoMinter _pseudoMinter = new PseudoMinter(token, this);

    crowdsale = new PreMintedCrowdsale(_startTime, _endTime, _rate, _wallet, _pseudoMinter);
    _pseudoMinter.transferOwnership(crowdsale);

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

  function PreMintedCrowdsale(
    uint256 _startTime,
    uint256 _endTime,
    uint256 _rate,
    address _wallet,
    Mintable _token
  ) public Crowdsale(_startTime, _endTime, _rate, _wallet, _token) { }

  // @return true if crowdsale event has ended
  function hasEnded() public view returns (bool) {
    bool capReached = PseudoMinter(token).availableSupply() < rate;
    return super.hasEnded() || capReached;
  }
}
