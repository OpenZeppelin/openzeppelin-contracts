pragma solidity ^0.4.8;

import './Ownable.sol';

/**
 * @title Contactable token
 * @dev Basic version of a contactable contract, allowing the owner to provide a string with their 
 * contact information.
 */
contract Contactable is Ownable{

    string public contactInformation;

    /**
     * @dev The setContactInformation() function allows the current owner to transfer control of the 
     * contract to a newOwner.
     * @param newOwner The address to transfer ownership to. 
     */
    function setContactInformation(string info) onlyOwner{
         contactInformation = info;
     }

}
