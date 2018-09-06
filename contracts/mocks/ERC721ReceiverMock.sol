pragma solidity ^0.4.24;

import "../token/ERC721/IERC721Receiver.sol";


contract ERC721ReceiverMock is IERC721Receiver {
  bytes4 internal retval_;
  bool internal reverts_;

  event Received(
    address operator,
    address from,
    uint256 tokenId,
    bytes data,
    uint256 gas
  );

  constructor(bytes4 _retval, bool _reverts) public {
    retval_ = _retval;
    reverts_ = _reverts;
  }

  function onERC721Received(
    address _operator,
    address _from,
    uint256 _tokenId,
    bytes _data
  )
    public
    returns(bytes4)
  {
    require(!reverts_);
    emit Received(
      _operator,
      _from,
      _tokenId,
      _data,
      gasleft() // msg.gas was deprecated in solidityv0.4.21
    );
    return retval_;
  }
}
