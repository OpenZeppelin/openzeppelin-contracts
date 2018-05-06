pragma solidity ^0.4.21;

import "../token/ERC20/StandardToken.sol";
import "../proposals/ERC1046/TokenMetadata.sol";


contract ERC20WithMetadataMock is StandardToken, ERC20WithMetadata {
  function ERC20WithMetadataMock(string _tokenURI)
    ERC20WithMetadata(_tokenURI)
    public
  {
  }
}
