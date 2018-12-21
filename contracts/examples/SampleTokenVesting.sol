pragma solidity ^0.4.24;

import "../drafts/TokenVesting.sol";

/**
 * @title SampleTokenVesting
 * @dev This is an example of a token vesting for defined time period. 
 * Tokens to be vested will be sent directly to this contract.
 */

contract SampleTokenVesting is TokenVesting{

    constructor(
        address beneficiary, 
        uint256 start, 
        uint256 cliffDuration, 
        uint256 duration, 
        bool revocable
    ) 
    public
    TokenVesting(beneficiary, start, cliffDuration, duration, revocable){}

}