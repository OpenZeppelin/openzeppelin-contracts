pragma solidity ^0.4.18;

import "../token/ERC721/ERC721Deed.sol";

/**
 * @title ERC721DeedMock
 * This mock just provides a public mint and burn functions for testing purposes.
 */
contract ERC721DeedMock is ERC721Deed {

  // ERC-165
  bytes4 internal constant INTERFACE_SIGNATURE_ERC165 = // 0x01ffc9a7
      bytes4(keccak256('supportsInterface(bytes4)'));

  bytes4 internal constant INTERFACE_SIGNATURE_ERC721 = // 0xda671b9b
      bytes4(keccak256('ownerOf(uint256)')) ^
      bytes4(keccak256('countOfDeeds()')) ^
      bytes4(keccak256('countOfDeedsByOwner(address)')) ^
      bytes4(keccak256('deedOfOwnerByIndex(address,uint256)')) ^
      bytes4(keccak256('approve(address,uint256)')) ^
      bytes4(keccak256('takeOwnership(uint256)'));

  function ERC721DeedMock() ERC721Deed() public {}

  function supportsInterface(bytes4 _interfaceID) external pure returns (bool) {
    return (
      _interfaceID == INTERFACE_SIGNATURE_ERC165
      || _interfaceID == INTERFACE_SIGNATURE_ERC721
    );
  }

  function mint(address _to, uint256 _tokenId) public {
    super._mint(_to, _tokenId);
  }

  function burn(uint256 _tokenId) public {
    super._burn(_tokenId);
  }
}
