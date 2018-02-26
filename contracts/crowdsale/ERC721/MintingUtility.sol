pragma solidity ^0.4.18;

import "../../lifecycle/Pausable.sol";

contract MintingUtility is Pausable {
   uint8 public _tokenBatchSize = 64;
    mapping (address => bool) public _authorizedMinters;

    function setTokenBatchSize(
        uint8 _size
    )
        external
        onlyOwner
    {
        _tokenBatchSize = _size;
    }

    /*
        @dev Validates the lenght of an input tokens is not over block limit estimation 
        @param _tokenIds - tokens.
    */
    modifier limitBatchSize(
        uint64[] _tokenIds
    ) {
        require(_tokenIds.length <= _tokenBatchSize);
        _;
    }

    /* 
        @dev Will add a contract or address that can call minting function on 
        token contract
        @param _authorized address of minter to add
        @param _isAuthorized set authorized or not
    */
    function setAuthorizedMinter(
        address _authorized,
        bool _isAuthorized
    )
        external
        onlyOwner
    {
        _authorizedMinters[_authorized] = _isAuthorized;
    }

    /* 
        Only minter contracts can access via this modifier
        Also, a minter either owns this contract or is in authorized list
    */
    modifier onlyMinter()
    {
        bool isAuthorized = _authorizedMinters[msg.sender];
        require(isAuthorized || msg.sender == owner);
        _;
    }
}
