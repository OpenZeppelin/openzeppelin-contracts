pragma solidity ^0.4.11;

import "./Identity.sol";

contract LifeCheck{

    address identity;
    uint public lastPing;
    uint public pendingUntil;
    States public state;

    enum States {Active, Inactive, Pending, Unclaimable}

    modifier atState(States _state) {
        require(state == _state);
        _;
    }

    modifier onlyOwner(){
        require(msg.sender == identity );
        lastPing = now;
        _;
    }

    event ClaimCreated(address addr, uint date);

    function LifeCheck(address id){
        identity = id;
        state = States.Active;
        lastPing = now;
    }

    function ping() onlyOwner{
        lastPing = now;
        if(state == States.Pending){
            resolveClaim();
        }
    }

    function createClaim() atState(States.Active){
        require(lastPing < now - 7 days);
        state = States.Pending;
        ClaimCreated(msg.sender, now);
    }

    function resolveClaim() atState(States.Pending) returns(bool claimSuccessful){
        if(pendingUntil >= now){
            return false;
        }
        if(lastPing > now - 7 days) {
            state = States.Active;
            return false;
        }
        state = States.Inactive;
        return true;
    }

    function setAsUnclaimableFor(uint _days) onlyOwner {
        if (state == States.Pending){
            resolveClaim();
        }
        state = States.Unclaimable;
        pendingUntil = now + _days * 1 days;
    }

    function setAsActive() atState(States.Unclaimable) returns(bool success){
        if (msg.sender == identity){
            state = States.Active;
            pendingUntil = now;
            lastPing = now;
            return true;
        } else {
            require(pendingUntil < now);
            state = States.Active;
            return true;
        }
    }

    function releaseWill() atState(States.Inactive){
        Identity id = Identity(identity);
        id.releaseWill();
    }

    function checkState() constant returns(uint){
        return uint(state);
    }
}
