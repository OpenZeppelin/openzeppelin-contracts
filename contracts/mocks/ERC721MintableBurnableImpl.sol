pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../token/ERC721/ERC721Full.sol";
import "../token/ERC721/ERC721Mintable.sol";
import "../token/ERC721/ERC721Burnable.sol";


/**
 * @title ERC721MintableBurnableImpl
 */
contract ERC721MintableBurnableImpl
  is Initializable, ERC721Full, ERC721Mintable, ERC721Burnable {

  constructor()
    public
  {
    ERC721Full.initialize("Test", "TEST");
    ERC721Mintable.initialize();
    ERC721Burnable.initialize();
  }
}
