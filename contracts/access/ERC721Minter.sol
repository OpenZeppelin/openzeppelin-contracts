pragma solidity ^0.4.23;

import "../token/ERC721/MintableERC721Token.sol";
import "./SignatureBouncer.sol";


/**
 * @title ERC721Minter
 * @author Matt Condon (@shrugs)
 * @dev A SignatureBouncer that allows users to mint themselves a MintableERC721Token
 *  iff they have a valid signature from a bouncer.
 * 1. Deploy a MintableERC721Token and ERC721Minter.
 * 2. Make ERC721Minter a minter of the token using `addMinter`.
 * 3. Make your server a bouncer of ERC721Minter using `addBouncer`.
 * 4. Generate a valid bouncer signature (address(this) + msg.sender + tokenId + tokenURI)
 *    and submit it to the ERC721Minter using `mint`
 */
contract ERC721Minter is SignatureBouncer {
  MintableERC721Token public token;

  constructor(MintableERC721Token _token)
    public
  {
    token = _token;
  }

  function mint(uint256 _tokenId, string _tokenURI, bytes _sig)
    onlyValidSignatureAndData(_sig)
    public
    returns (uint256)
  {
    token.mint(msg.sender, _tokenId, _tokenURI);
    return _tokenId;
  }
}
