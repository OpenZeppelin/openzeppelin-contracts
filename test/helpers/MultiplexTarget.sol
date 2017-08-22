pragma solidity ^0.4.10;

import '../../contracts/ownership/Ownable.sol';

contract MultiplexTarget is Ownable {

    address public bursar;

    modifier onlyBursar() {
        require(msg.sender == bursar);
        _;
    }

    function setBursar(address newBursar)
        public
        onlyOwner()
    {
        bursar = newBursar;
    }

    function bursarCanCall()
        public
        onlyBursar()
        returns (bool)
    {
        return true;
    }

    function everyoneCanCall()
        public
        returns (bool)
    {
        return true;
    }
}
