pragma solidity ^0.4.18;

import "./ERC721Receiver.sol";

contract ERC721Holder is ERC721Receiver {
  function onERC721Received(address, uint256, bytes) public returns(bytes4) {
    return ERC721_RECEIVED;
  }
}
