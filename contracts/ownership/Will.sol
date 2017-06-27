pragma solidity ^0.4.8;

import "./Ownable.sol";

contract Will is Ownable{

    uint public maxPingInterval = 2 days;
    uint lastPingTime;
    Heir[]  heirs;

     modifier onlyOwner() {
     if (msg.sender != owner) {
       throw;
     }
     _;
     lastPingTime = now;
   }

   function Will(){
     lastPingTime = now;
   }

   function getLastPingTime() constant returns(uint){
     return lastPingTime;
   }

   function deposit() payable{
   }

    struct Heir{
        address addr;
        uint id;
    }

    function ping() onlyOwner returns(uint) {
        return lastPingTime;
    }


     function getHeirCount() constant returns(uint) {
        return heirs.length;
    }

    function addHeir(address heir) onlyOwner returns(uint) {
        uint id = getHeirCount();
        heirs.push(Heir({addr:heir, id:id}));
        return id;
    }

    function changeMaxPingInterval(uint _days) onlyOwner{
        maxPingInterval = _days * 1 days;
    }

    function claimHeirtage(){
        uint timePassed = now - lastPingTime;
        if (timePassed < maxPingInterval) throw;
        uint share = this.balance/getHeirCount();
        for(uint i=0; i < getHeirCount(); i++){
          heirs[i].addr.transfer(share);
        }
    }

}
