pragma solidity ^0.4.24;

contract Reverter {
    bool public toggle = true;

    function requiresTrue(bool param) public pure returns (bool) {
        require(param == true, "Passed argument must be true");
        return true;
    }

    function requiresGas() public returns (bool) {
        toggle = !toggle;
    }
}