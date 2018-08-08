pragma solidity ^0.4.24;

import "../token/ERC721/ERC721Receiver.sol";


contract ERC721ReceiverMock is ERC721Receiver {
  bytes4 retval;
  bool reverts;

  event Received(
    address _operator,
    address _from,
    uint256 _tokenId,
    bytes _data,
    uint256 _gas
  );

  constructor(bytes4 _retval, bool _reverts) public {
    retval = _retval;
    reverts = _reverts;
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
    require(!reverts);
    emit Received(
      _operator,
      _from,
      _tokenId,
      _data,
      gasleft() // msg.gas was deprecated in solidityv0.4.21
    );
    return retval;
  }
}
