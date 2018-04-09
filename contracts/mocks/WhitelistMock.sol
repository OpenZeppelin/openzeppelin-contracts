pragma solidity ^0.4.21;

import "../ownership/Whitelist.sol";


contract WhitelistMock is Whitelist {

  function onlyWhitelistedCanDoThis()
    onlyWhitelisted
    view
    external
  {
  }
}
