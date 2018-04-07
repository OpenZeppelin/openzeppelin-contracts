pragma solidity ^0.4.13;

/**
 * @title Grantable
 * @dev The Grantable contract has a grants mapping, and provides basic grants control
 * functions, this simplifies the implementation of "access granting".
 */
contract Grantable {
    mapping(address => bool) public grants;
    
    event AccessGranted(address indexed grantee);
    event AccessDeprivation(address indexed grantee);
    
    /**
    * @dev The Grantable constructor assign grants to the sender account
    */
    function Grantable() public {
        grants[msg.sender] = true;
        AccessGranted(msg.sender);
    }
    
    /**
    * @dev Throws if called by any account without grants.
    */
    modifier onlyGranted(){
        require(grants[msg.sender]);
        _;
    }
    
    /**
    * @dev Allows only the account granted with access to assgin grants to new grantee.
    * @param _grantee The address to grant access to.
    */
    function assignGrants(address _grantee) public onlyGranted {
        grants[_grantee] = true;
        AccessGranted(_grantee);
    }
    
    /**
    * @dev Allows only the account granted with access to deprive grants from a grantee.
    * @param _grantee The address to deprive grants to.
    */
    function depriveGrants(address _grantee) public onlyGranted {
        grants[_grantee] = false;
        AccessDeprivation(_grantee);
    }
}
