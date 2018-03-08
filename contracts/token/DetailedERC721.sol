pragma solidity ^0.4.18;

import "./ERC721.sol";

/**
 * @title Detailed ERC721 interface
 * @dev see https://github.com/ethereum/eips/issues/721
 */
contract DetailedERC721 is ERC721 {
  function name() public view returns (string _name);
  function symbol() public view returns (string _symbol);
  function implementsERC721() public pure returns (bool);
  function setTokenMetadata(uint256 _tokenId, string _metadata) public;
  function tokenMetadata(uint256 _tokenId) public view returns (string infoUrl);
  function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256 _tokenId);
}
