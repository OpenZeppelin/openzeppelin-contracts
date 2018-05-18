pragma solidity ^0.4.23;

import "../token/ERC721/MintableERC721Token.sol";
import "./SignatureBouncer.sol";
import "./NonceTracker.sol";

/**
 * @title ERC721Minter
 * @author Matt Condon (@shrugs)
 * @dev A SignatureBouncer that allows users to mint themselves a MintableERC721Token
 * @dev  iff they have a valid signature from a bouncer.
 * @dev 1. Deploy a MintableERC721Token and ERC721Minter.
 * @dev 2. Make ERC721Minter a minter of the token using `addMinter`.
 * @dev 3. Make your server a bouncer of ERC721Minter using `addBouncer`.
 * @dev 4. Generate a valid bouncer signature and submit it to the ERC721Minter using `mint`
 * @dev Override `mint()` to add tokenURI information.
 */
contract ERC721Minter is SignatureBouncer, NonceTracker {
  MintableERC721Token public token;

  constructor(MintableERC721Token _token)
    public
  {
    token = _token;
  }

  function mint(bytes _sig)
    onlyValidSignature(_sig)
    withAccess(msg.sender, 1)
    public
    returns (uint256)
  {
    return token.mint(msg.sender, "");
  }
}
