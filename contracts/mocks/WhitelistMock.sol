pragma solidity ^0.4.23;

import "../access/Whitelist.sol";

contract WhitelistMock is Whitelist {

  function onlyWhitelistedCanDoThis()
    onlyWhitelisted
    view
    external
  {
  }
}
