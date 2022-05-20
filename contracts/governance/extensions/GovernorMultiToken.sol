// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IGovernorMultiToken.sol";

/**
 * @dev Extension of ERC4626 which allows for voting based on an account's underlying asset balance
 */
abstract contract GovernorMultiToken {
    IGovernorMultiToken[] private _tokens;

    constructor(IGovernorMultiToken[] memory assets){
        _tokens = assets;
    }

    /**
     * @dev Get the totalSupply of tokens.
     */
    function balanceOf(address account) public virtual returns(uint256) {
        uint256 supply;

        for(uint256 i = 0; i < _tokens.length; i++)
        {
            supply = supply += _tokens[i].balanceOf(account);
        }

        return supply;
    }

    /**
     * @dev Get the totalSupply of tokens.
     */
    function totalSupply() public virtual returns(uint256) {
        uint256 supply;

        for(uint256 i = 0; i < _tokens.length; i++)
        {
            supply = supply += _tokens[i].totalSupply();
        }

        return supply;
    }

    /**
     * @dev Get the totalSupply of tokens.
     */
    function getPastTotalSupply(uint256 blockNumber) public virtual returns(uint256) {
        uint256 supply;

        for(uint256 i = 0; i < _tokens.length; i++)
        {
            supply = supply += _tokens[i].getPastTotalSupply(blockNumber);
        }

        return supply;
    }

    /**
     * @dev Get the past votes of tokens
     */
    function getPastVotes(address account, uint256 blockNumber) public view returns(uint256) {
        uint256 votes;

        for(uint256 i = 0; i < _tokens.length; i++)
        {
            votes = votes += _tokens[i].getPastVotes(account, blockNumber);
        }

        return votes;
    }

    /**
     * @dev Get the past votes of tokens
     */
    function getVotes(address account) public view returns(uint256) {
        uint256 votes;

        for(uint256 i = 0; i < _tokens.length; i++)
        {
            votes = votes += _tokens[i].getVotes(account);
        }

        return votes;
    }
}
