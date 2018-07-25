pragma solidity ^0.4.21;

import "../token/ERC20/StandardToken.sol";
import "../proposals/ERC1046/TokenMetadata.sol";


contract ERC20WithMetadataMock is StandardToken, ERC20WithMetadata {
  constructor(string _tokenURI) public
    ERC20WithMetadata(_tokenURI)
  {
  }
}
