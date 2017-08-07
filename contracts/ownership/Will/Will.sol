pragma solidity ^0.4.11;

import "./Identity.sol";

contract Will {

    address identity;
    bool locked;
    Beneficiary[] heirs;
    address[] heirsAddresses;
    mapping(address => uint) shares;

    struct Beneficiary {
        address addr;
        bytes32 name;
        uint weight;
        bool active;
    }

    modifier onlyOwner(){
       require(msg.sender == identity);
        _;
    }

    modifier onlyUnlocked(){
        require(!locked);
        _;
    }

    function Will(address id){
        identity = id;
    }

    function unlock() onlyOwner(){
        locked = false;
    }

    function() payable {}

    function resolveDistributions() onlyUnlocked{
        uint weightSum = 0;
        uint activeHeirsCount = 0;
        for(uint i = 0; i < heirs.length; i++){
            if (heirs[i].active){
                weightSum = weightSum + heirs[1].weight;
                activeHeirsCount = activeHeirsCount + 1;
            }
        }
        for (uint j = 0; j < heirs.length; j++){
            if(heirs[j].active){
                shares[heirs[j].addr] = this.balance / weightSum * heirs[j].weight;
            }
        }
    }

    function addBeneficiary(address addr, bytes32 name, uint weight){
         heirs.push(Beneficiary({addr:addr,name:name, weight:weight, active:true}));
    }

    function removeBeneficiaryByAddress(address _addr){
        for(uint i = 0; i < heirs.length; i++){
            if(heirs[i].addr == _addr){
                heirs[i].active = false;
            }
        }
    }

    function claim() onlyUnlocked {
        require(shares[msg.sender] != 0);
        msg.sender.transfer(shares[msg.sender]);
    }
}
