pragma solidity ^0.4.23;

import "../token/ERC721/MintableERC721Token.sol";
import "./SignatureBouncer.sol";
import "../AutoIncrementing.sol";


/**
 * @title AutoIncrementingERC721Minter
 * @author Matt Condon (@shrugs)
 * @dev An ERc721Minter that generates auto-incrementing `tokenId`s.
 */
contract AutoIncrementingERC721Minter is AutoIncrementing, SignatureBouncer {
  MintableERC721Token public token;

  constructor(MintableERC721Token _token)
    public
  {
    token = _token;
  }

  function mint(bytes _sig, string _tokenURI)
    public
    returns (uint256)
  {
    require(
      isValidMintSignature(
        msg.sender,
        _sig,
        _tokenURI
      )
    );

    uint256 _tokenId = nextId();
    token.mint(msg.sender, _tokenId, _tokenURI);
    return _tokenId;
  }

  function isValidMintSignature(
    address _address,
    bytes _sig,
    string _tokenURI
  )
    internal
    view
    returns (bool)
  {
    return isValidDataHash(
      keccak256(
        address(this),
        _address,
        _tokenURI
      ),
      _sig
    );
  }
}
