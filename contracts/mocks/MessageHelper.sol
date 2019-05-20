pragma solidity ^0.5.0;


contract MessageHelper {

    event Show(bytes32 b32, uint256 number, string text);

    function showMessage(bytes32 b32, uint256 number, string memory text)
        public payable returns (bool)
    {
        emit Show(b32, number, text);
        return true;
    }

    function fail() public {
        revert("MessageHelper fail function failed");
    }

}
