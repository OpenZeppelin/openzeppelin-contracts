pragma solidity ^0.8.20;

import {Nonces} from "../../openzeppelin-contracts/contracts/utils/Nonces.sol";

contract MyNonces is Nonces {
    function getNonce(address add) public returns(uint256){
        return nonces(add);
    }

    function useNonce(address add) public returns(uint256){
        return _useNonce(add);
    }

    function useCheckedNonce(address add, uint256 nonce) public {
        _useCheckedNonce(add, nonce);
    }
}