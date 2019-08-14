pragma solidity ^0.5.0;

import "../examples/SampleCrowdsale.sol";


contract SampleCrowdsaleTokenMock is SampleCrowdsaleToken {
    constructor() public {
        SampleCrowdsaleToken.initialize(_msgSender());
    }
}

contract SampleCrowdsaleMock is SampleCrowdsale {
    constructor(
        uint256 openingTime,
        uint256 closingTime,
        uint256 rate,
        address payable wallet,
        uint256 cap,
        ERC20Mintable token,
        uint256 goal
    )
        public
    {
        SampleCrowdsale.initialize(openingTime, closingTime, rate, wallet, cap, token, goal);
    }
}
