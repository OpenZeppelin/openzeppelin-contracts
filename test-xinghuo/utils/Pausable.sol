pragma solidity ^0.8.20;

import {Pausable} from "../../openzeppelin-contracts/contracts/utils/Pausable.sol";


contract MyPausable is Pausable{

    function pause() public{
        _pause();
    }

    function unpause() public{
        _unpause();
    }

    function whennotpaused() public whenNotPaused returns(uint256){
        return 1;
    }

    function whenpaused() public whenPaused returns(uint256) {
        return 2;
    }
}