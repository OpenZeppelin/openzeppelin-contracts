pragma solidity ^0.5.0;

import "../drafts/TokenVesting.sol";

contract TokenVestingMock is TokenVesting {
    constructor(
        address beneficiary,
        uint256 start,
        uint256 cliffDuration,
        uint256 duration,
        bool revocable
    ) public {
        TokenVesting.initialize(
            beneficiary,
            start,
            cliffDuration,
            duration,
            revocable,
            _msgSender()
        );
    }
}
