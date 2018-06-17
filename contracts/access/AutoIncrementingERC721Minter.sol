pragma solidity ^0.4.24;

import "../token/ERC721/MintableERC721Token.sol";
import "./SignatureBouncer.sol";
import "../AutoIncrementing.sol";


/**
 * @title AutoIncrementingERC721Minter
 * @author Matt Condon (@shrugs)
 * @dev An ERC721Minter that generates auto-incrementing `tokenId`s.
 */
contract AutoIncrementingERC721Minter is AutoIncrementing, SignatureBouncer {
  MintableERC721Token public token;

  constructor(MintableERC721Token _token)
    public
  {
    token = _token;
  }

  function mint(string _tokenURI, bytes _sig)
    onlyValidSignatureAndData(_sig)
    public
    returns (uint256)
  {
    uint256 _tokenId = nextId();
    token.mint(msg.sender, _tokenId, _tokenURI);
    return _tokenId;
  }
}
