pragma solidity ^0.4.11;


import './ERC20.sol';

/**
 * @title Non Tradable Token
 * @author Jitendra Chittoda <jitendra@chittoda.com>
 * @dev Non Tradable ERC20 token
 */
contract NonTradableToken is ERC20 {

    mapping(address => uint256) balances;

    bool public constant isTradable = false;

    /**
     * transfer method call disabled
     */
    function transfer(address _to, uint256 _value) public returns (bool) {
        require(isTradable);
    }

    /**
     * transferFrom method call disabled
     */
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool) {
        require(isTradable);
    }

    /**
     * approve method call disabled
    */
    function approve(address _spender, uint256 _value) public returns (bool) {
        require(isTradable);
    }

    /**
     * allowance method call disabled
    */
    function allowance(address _owner, address _spender) public constant returns (uint256 remaining) {
        return 0;
    }

    /**
    * @dev Gets the balance of the specified address.
    * @param _owner The address to query the the balance of.
    * @return An uint256 representing the amount owned by the passed address.
    */
    function balanceOf(address _owner) public constant returns (uint256 balance) {
        return balances[_owner];
    }

}