pragma solidity ^0.4.11;

import "../Ownable.sol";
import "./LifeCheck.sol";
import "./Will.sol";

contract Identity is Ownable{

    address lifeCheck;
    address will;

    modifier onlyInactive(){
        LifeCheck hc = LifeCheck(lifeCheck);
        require(hc.checkState() == 1);
        _;
    }

    function deposit() payable returns(uint) {
        return this.balance;
    }

    function transfer(address to, uint amount) onlyOwner{
        to.transfer(amount);
    }

    function releaseWill() onlyInactive {
        Will wl = Will(will);
        wl.unlock();
        wl.transfer(this.balance);
    }

    function callLifeCheck(uint value, bytes data){
        lifeCheck.call.value(value)(data);
    }

    function callWill(uint value, bytes data){
        will.call.value(value)(data);
    }

    function changeWillAddress(address _will){
        will = _will;
    }

    function changeLifeCheckAddress(address lf){
        lifeCheck = lf;
    }
}
