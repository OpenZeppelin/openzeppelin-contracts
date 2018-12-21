pragma solidity ^0.4.24;

import "../token/ERC20/ERC20Mintable.sol";
import "../token/ERC20/ERC20Detailed.sol";
import "../token/ERC20/TokenTimelock.sol";

/**
 * @title SampleTimelockToken
 * @dev Very simple ERC20 Token that can be minted.
 * It is meant to be used in a tokentimelock contract.
 */
contract SampleTimelockToken is ERC20Mintable, ERC20Detailed {
    constructor() public ERC20Detailed("Sample Timelock Token", "STT", 18) {}
}


/**
 * @title SampleTokenTimelock
 * @dev This is an example of a token lock for certain time.
 */

contract SampleTokenTimelock is TokenTimelock{

    constructor(
        ERC20Mintable token,
        address beneficiary,
        uint256 releaseTime
    ) 
    public
    TokenTimelock(token, beneficiary, releaseTime){}

} 
