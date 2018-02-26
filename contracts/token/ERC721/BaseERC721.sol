pragma solidity ^0.4.18;

/**
 * @title Base ERC721 interface
 * @dev see https://github.com/ethereum/eips/issues/721 and https://github.com/ethereum/EIPs/pull/841
 */
contract BaseERC721 {
  event Transfer(address indexed _from, address indexed _to, uint256 _tokenId);
  event Approval(address indexed _owner, address indexed _approved, uint256 _tokenId);

  function balanceOf(address _owner) public view returns (uint256 _balance);
  function ownerOf(uint256 _tokenId) public view returns (address _owner);
  function transfer(address _to, uint256 _tokenId) public;
  function approve(address _to, uint256 _tokenId) public;
  function takeOwnership(uint256 _tokenId) public;
}
