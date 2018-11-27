pragma solidity ^0.4.24;

contract Failer {
    uint256[] private array;

    function dontFail() public pure {
    }

    function failWithRevert() public pure {
        revert();
    }

    function failWithThrow() public pure {
        assert(false);
    }

    function failWithOutOfGas() public {
        for (uint256 i = 0; i < 2**200; ++i) {
            array.push(i);
        }
    }
}
