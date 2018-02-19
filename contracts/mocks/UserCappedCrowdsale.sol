pragma solidity ^0.4.18;

//import "../examples/SimpleToken.sol";
import "../token/ERC20/ERC20.sol";
import "../crowdsale/validation/UserCappedCrowdsale.sol";


contract UserCappedCrowdsaleImpl is UserCappedCrowdsale {
  
  function UserCappedCrowdsaleImpl (
    uint256 _rate,
    address _wallet,
    ERC20 _token
  ) public
    Crowdsale(_rate, _wallet, _token)
  {
  }

}
