pragma solidity ^0.4.18;

import "./ERC721Token.sol";
import "./DetailedERC721.sol";

/**
 * @title Detailed ERC721 Token
 * This implementation includes all the required and optional functionality of the ERC721 standard
 * @dev see https://github.com/ethereum/eips/issues/721
 */
contract DetailedERC721Token is DetailedERC721, ERC721Token {
  // Token name
  string private _name;

  // Token symbol
  string private _symbol;

  // Token metadata
  mapping (uint256 => string) private _metadata;

  // Event triggered every time a token metadata gets updated
  event MetadataUpdated(address _owner, uint256 _tokenId, string _newMetadata);

  /**
    * @dev Constructor function
    */
  function DetailedERC721Token(string name, string symbol) public {
    _name = name;
    _symbol = symbol;
  }

  /**
  * @dev Gets the token name
  * @return string representing the token name
  */
  function name() public view returns (string) {
    return _name;
  }

  /**
  * @dev Gets the token symbol
  * @return string representing the token symbol
  */
  function symbol() public view returns (string) {
    return _symbol;
  }

  /**
  * @dev Ensures this contract is an ERC721 implementation
  * @return true to ensure this contract implements ERC721 functionality
  */
  function implementsERC721() public pure returns (bool) {
    return true;
  }

  /**
  * @dev Gets the token ID at a given index of the tokens list of the requested owner
  * @param _owner address owning the tokens list to be accessed
  * @param _index uint256 representing the index to be accessed of the requested tokens list
  * @return uint256 token ID at the given index of the tokens list owned by the requested address
  */
  function tokenOfOwnerByIndex(address _owner, uint256 _index) public view returns (uint256) {
    require(_index < balanceOf(_owner));
    return tokensOf(_owner)[_index];
  }

  /**
  * @dev Gets the metadata of the given token ID
  * @param _tokenId uint256 ID of the token to query the metadata of
  * @return string representing the metadata of the given token ID
  */
  function tokenMetadata(uint256 _tokenId) public view returns (string) {
    return _metadata[_tokenId];
  }

  /**
  * @dev Sets the metadata of the given token ID
  * @param _tokenId uint256 ID of the token to set the metadata of
  * @param _newMetadata string representing the new metadata to be set
  */
  function setTokenMetadata(uint256 _tokenId, string _newMetadata) public onlyOwnerOf(_tokenId) {
    _metadata[_tokenId] = _newMetadata;
    MetadataUpdated(msg.sender, _tokenId, _newMetadata);
  }
}
