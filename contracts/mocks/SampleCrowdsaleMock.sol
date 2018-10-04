pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../examples/SampleCrowdsale.sol";


contract SampleCrowdsaleTokenMock is Initializable, SampleCrowdsaleToken {
  constructor() public {
    SampleCrowdsaleToken.initialize();
  }
}

contract SampleCrowdsaleMock is Initializable,  SampleCrowdsale {
  constructor(
    uint256 openingTime,
    uint256 closingTime,
    uint256 rate,
    address wallet,
    uint256 cap,
    ERC20Mintable token,
    uint256 goal
  )
    public
  {
    SampleCrowdsale.initialize(openingTime, closingTime, rate, wallet, cap, token, goal);
  }
}
