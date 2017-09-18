pragma solidity ^0.4.11;

import "./Ownable.sol";

contract WhiteListable is Ownable {
    mapping (address => bool) public whiteList;


    function WhiteListable() {
        whiteList[msg.sender] = true;
    }

    modifier onlyWhiteList() {
        require(whiteList[msg.sender]);
        _;
    }

    modifier memberDoesNotExist(address member) {
        if (isMember[member])
            throw;
        _;
    }

    modifier memberExists(address member) {
        if (!isMember[member])
            throw;
        _;
    }

    function addMember(address member) onlyOwner memberDoesNotExist(member) {
        whiteList[member] = true;
    }

    function removeMember(address member) onlyOwner memberExists(member){
        delete whiteList[member];
    }

    function isWhiteListMember(address _member) public constant returns (bool) {
        return whiteList[_member] == true;
    }

    function getMembers() public constant returns (address[]) {
        // TODO
        return address[];
    }
}
