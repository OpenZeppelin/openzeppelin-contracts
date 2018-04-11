pragma solidity ^0.4.21;


contract MessageHelper {

  event Show(bytes32 b32, uint256 number, string text);

  function showMessage( bytes32 message, uint256 number, string text ) public returns (bool) {
    emit Show(message, number, text);
    return true;
  }

  function fail() public {
    require(false);
  }

  function call(address to, bytes data) public returns (bool) {
    // solium-disable-next-line security/no-low-level-calls
    if (to.call(data))
      return true;
    else
      return false;
  }

}
