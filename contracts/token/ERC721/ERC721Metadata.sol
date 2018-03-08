pragma solidity ^0.4.18;

import "./ERC721.sol";


/**
 * @title Full ERC721 interface with metadata
 * @dev see https://github.com/ethereum/eips/issues/721 and https://github.com/ethereum/EIPs/pull/841
 */
contract ERC721Metadata is ERC721 {
  event MetadataUpdated(address _owner, uint256 _tokenId, string _newMetadata);

  function setTokenMetadata(uint256 _tokenId, string _metadata) public;
  function tokenMetadata(uint256 _tokenId) public view returns (string infoUrl);
}
