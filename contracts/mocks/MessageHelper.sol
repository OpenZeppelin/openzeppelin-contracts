pragma solidity ^0.4.24;


contract MessageHelper {

  event Show(bytes32 b32, uint256 number, string text);
  event Buy(bytes32 b32, uint256 number, string text, uint256 value);

  function showMessage(
    bytes32 message,
    uint256 number,
    string text
  )
    public
    returns (bool)
  {
    emit Show(message, number, text);
    return true;
  }

  function buyMessage(
    bytes32 message,
    uint256 number,
    string text
  )
    public
    payable
    returns (bool)
  {
    emit Buy(
      message,
      number,
      text,
      msg.value);
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
