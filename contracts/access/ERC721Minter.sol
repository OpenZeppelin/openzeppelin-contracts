pragma solidity ^0.4.23;

import "../token/ERC721/MintableERC721Token.sol";
import "./SignatureBouncer.sol";


/**
 * @title ERC721Minter
 * @author Matt Condon (@shrugs)
 * @dev A SignatureBouncer that allows users to mint themselves a MintableERC721Token
 * @dev  iff they have a valid signature from a bouncer.
 * @dev 1. Deploy a MintableERC721Token and ERC721Minter.
 * @dev 2. Make ERC721Minter a minter of the token using `addMinter`.
 * @dev 3. Make your server a bouncer of ERC721Minter using `addBouncer`.
 * @dev 4. Generate a valid bouncer signature (address(this) + msg.sender + tokenId + tokenURI)
 * @dev    and submit it to the ERC721Minter using `mint`
 */
contract ERC721Minter is SignatureBouncer {
  MintableERC721Token public token;

  constructor(MintableERC721Token _token)
    public
  {
    token = _token;
  }

  function mint(bytes _sig, uint256 _tokenId, string _tokenURI)
    public
    returns (uint256)
  {
    require(
      isValidMintSignature(
        msg.sender,
        _sig,
        _tokenId,
        _tokenURI
      )
    );

    token.mint(msg.sender, _tokenId, _tokenURI);
    return _tokenId;
  }

  function isValidMintSignature(
    address _address,
    bytes _sig,
    uint256 _tokenId,
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
        _tokenId,
        _tokenURI
      ),
      _sig
    );
  }
}
