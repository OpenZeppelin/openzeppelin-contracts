pragma solidity ^0.4.24;

import "../access/Whitelist.sol";


contract WhitelistMock is Whitelist {

  function onlyWhitelistedCanDoThis()
    external
    onlyIfWhitelisted(msg.sender)
    view
  {
  }
}
