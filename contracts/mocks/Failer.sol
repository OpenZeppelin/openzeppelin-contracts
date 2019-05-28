pragma solidity ^0.5.2;

contract Failer {
    uint256[] private array;

    function dontFail() public pure {
        // solhint-disable-previous-line no-empty-blocks
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
