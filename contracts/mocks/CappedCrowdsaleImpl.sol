pragma solidity ^0.4.18;

//import "../examples/SimpleToken.sol";
import "../token/ERC20/ERC20.sol";
import "../crowdsale-refactor/validation/CappedCrowdsale.sol";


contract CappedCrowdsaleImpl is CappedCrowdsale {

  function CappedCrowdsaleImpl (
    uint256 _rate,
    address _wallet,
    uint256 _cap,
    ERC20 _token
  ) public
    Crowdsale(_rate, _wallet, _token)
    CappedCrowdsale(_cap)
  {
  }

}
