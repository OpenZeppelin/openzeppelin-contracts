pragma solidity ^0.4.21;

import "../crowdsale/validation/MerkleIndividuallyCappedCrowdsale.sol";
import "../token/ERC20/ERC20.sol";


contract MerkleIndividuallyCappedCrowdsaleImpl is MerkleIndividuallyCappedCrowdsale {

  function MerkleIndividuallyCappedCrowdsaleImpl(
    uint256 _rate,
    address _wallet,
    ERC20 _token
  )
    public
    Crowdsale(_rate, _wallet, _token)
  {
  }

}
