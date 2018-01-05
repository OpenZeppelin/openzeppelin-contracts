pragma solidity ^0.4.15;

import './NFT.sol';

contract BasicNFT is NFT, NFTEvents {

  uint public totalTokens;

  // Array of owned tokens for a user
  mapping(address => uint[]) public ownedTokens;
  mapping(address => uint) _virtualLength;
  mapping(uint => uint) _tokenIndexInOwnerArray;

  // Mapping from token ID to owner
  mapping(uint => address) public tokenOwner;

  // Allowed transfers for a token (only one at a time)
  mapping(uint => address) public allowedTransfer;
  mapping(address => address) public allowAll;

  // Metadata associated with each token
  mapping(uint => string) public _tokenMetadata;

  // Global lock to avoid reentrancy on methods that call external functions
  private bool globalLock = false;

  function totalSupply() public constant returns (uint) {
    return totalTokens;
  }

  function balanceOf(address owner) public constant returns (uint) {
    return _virtualLength[owner];
  }

  function tokenOfOwnerByIndex(address owner, uint index) public constant returns (uint) {
    require(index >= 0 && index < balanceOf(owner));
    return ownedTokens[owner][index];
  }

  function getAllTokens(address owner) public constant returns (uint[]) {
    uint size = _virtualLength[owner];
    uint[] memory result = new uint[](size);
    for (uint i = 0; i < size; i++) {
      result[i] = ownedTokens[owner][i];
    }
    return result;
  }

  function ownerOf(uint tokenId) public constant returns (address) {
    return tokenOwner[tokenId];
  }

  function transfer(address to, uint tokenId) public {
    require(tokenOwner[tokenId] == msg.sender || allowAll[tokenOwner[tokenId]] == msg.sender);
    return _transfer(tokenOwner[tokenId], to, tokenId);
  }

  function takeOwnership(uint tokenId) public {
    require(allowedTransfer[tokenId] == msg.sender || allowAll[tokenOwner[tokenId]] == msg.sender);
    return _transfer(tokenOwner[tokenId], msg.sender, tokenId);
  }

  function transferFrom(address from, address to, uint tokenId) public {
    require(allowedTransfer[tokenId] == msg.sender || allowAll[tokenOwner[tokenId]] == msg.sender);
    return _transfer(tokenOwner[tokenId], to, tokenId);
  }

  function approve(address beneficiary, uint tokenId) public {
    require(msg.sender == tokenOwner[tokenId]);

    if (allowedTransfer[tokenId] != 0) {
      allowedTransfer[tokenId] = 0;
    }
    allowedTransfer[tokenId] = beneficiary;
    Approval(tokenOwner[tokenId], beneficiary, tokenId);
  }

  function approveAll(address beneficiary) public {
    allowAll[msg.sender] = beneficiary;
  }

  /**
   * Provides a way to automatically call another contract after approval
   */
  function transferTo(address targetContract, uint tokenId, bytes inputData) payable external returns(bool) {
    require(tokenOwner[tokenId] == msg.sender
      || allowAll[tokenOwner[tokenId]] == msg.sender);

    require(!globalLock);
    globalLock = true;

    _transfer(tokenOwner[tokenId], targetContract, tokenId);
    require(targetContract.call.value(msg.value)(inputData));

    globalLock = false;
  }

  function tokenMetadata(uint tokenId) constant public returns (string) {
    return _tokenMetadata[tokenId];
  }

  function metadata(uint tokenId) constant public returns (string) {
    return _tokenMetadata[tokenId];
  }

  function updateTokenMetadata(uint tokenId, string _metadata) public {
    require(msg.sender == tokenOwner[tokenId]);
    _tokenMetadata[tokenId] = _metadata;
    MetadataUpdated(tokenId, msg.sender, _metadata);
  }

  function _transfer(address from, address to, uint tokenId) internal {
    _clearApproval(tokenId);
    _removeTokenFrom(from, tokenId);
    _addTokenTo(to, tokenId);
    Transferred(tokenId, from, to);
  }

  function _clearApproval(uint tokenId) internal {
    allowedTransfer[tokenId] = 0;
    Approval(tokenOwner[tokenId], 0, tokenId);
  }

  function _removeTokenFrom(address from, uint tokenId) internal {
    require(_virtualLength[from] > 0);

    uint length = _virtualLength[from];
    uint index = _tokenIndexInOwnerArray[tokenId];
    uint swapToken = ownedTokens[from][length - 1];

    ownedTokens[from][index] = swapToken;
    _tokenIndexInOwnerArray[swapToken] = index;
    _virtualLength[from]--;
  }

  function _addTokenTo(address owner, uint tokenId) internal {
    if (ownedTokens[owner].length == _virtualLength[owner]) {
      ownedTokens[owner].push(tokenId);
    } else {
      ownedTokens[owner][_virtualLength[owner]] = tokenId;
    }
    tokenOwner[tokenId] = owner;
    _tokenIndexInOwnerArray[tokenId] = _virtualLength[owner];
    _virtualLength[owner]++;
  }
}

