pragma solidity ^0.4.18;

import "./DetailedERC721TokenMock.sol";
import "../token/OperatableERC721Token.sol";

/**
 * @title OperatableERC721TokenMock
 * We needed to implement this mock contract just to provide a new interface renaming the overloaded functions of
 * the OperatableERC721Token contract. This was needed since Truffle does not support calling overloaded functions.
 * Please see https://github.com/trufflesuite/truffle/issues/737
 */
contract OperatableERC721TokenMock is OperatableERC721Token, DetailedERC721TokenMock {
  function OperatableERC721TokenMock(string name, string symbol) DetailedERC721TokenMock(name, symbol) public { }

  function transferAndCall(address _to, uint _tokenId, bytes _data) public {
    super.transfer(_to, _tokenId, _data);
  }
}
