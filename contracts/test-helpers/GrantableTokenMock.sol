pragma solidity ^0.4.4;
import "./StandardTokenMock.sol";

contract GrantableTokenMock is StandardTokenMock {
  function GrantableTokenMock(address initialAccount, uint initialBalance)
           StandardTokenMock(initialAccount, initialBalance) {}
}
