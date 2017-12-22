pragma solidity ^0.4.15;

contract NFT {
  function totalSupply() constant returns (uint);
  function balanceOf(address) constant returns (uint);

  function tokenOfOwnerByIndex(address owner, uint index) constant returns (uint);
  function ownerOf(uint tokenId) constant returns (address);

  function transfer(address to, uint tokenId);
  function takeOwnership(uint tokenId);
  function transferFrom(address from, address to, uint tokenId);
  function approve(address beneficiary, uint tokenId);

  function metadata(uint tokenId) constant returns (string);
}

contract NFTEvents {
  event Created(uint tokenId, address owner, string metadata);
  event Destroyed(uint tokenId, address owner);

  event Transferred(uint tokenId, address from, address to);
  event Approval(address owner, address beneficiary, uint tokenId);

  event MetadataUpdated(uint tokenId, address owner, string data);
}

