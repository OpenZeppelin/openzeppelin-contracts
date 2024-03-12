pragma solidity ^0.8.20;

import {ERC2771Context} from "../../openzeppelin-contracts/contracts/metatx/ERC2771Context.sol";

contract MyERC2771Context is ERC2771Context {
    constructor(address trustedForwarder_) ERC2771Context(trustedForwarder_) {
        
    }
    
    function TrustedForwarder() public view returns (address) {
        return trustedForwarder();
    }

    function IsTrustedForwarder(address forwarder) public view returns (bool) {
        return isTrustedForwarder(forwarder);
    }

    function MsgSender() public view returns (address) {
        return _msgSender();
    }

    function MsgData() public view returns (bytes memory) {
        return _msgData();
    }

    function ContextSuffixLength() public view returns (uint256) {
        return _contextSuffixLength();
    }
}