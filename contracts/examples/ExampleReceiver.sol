pragma solidity ^0.4.18;

import "../token/StandardReceiver.sol";

/**
 * @title ExampleReceiver 
 *
 * file: ExampleReceiver.sol
 * location: contracts/example/
 *
*/
contract ExampleReceiver is StandardReceiver {
    function foo(/*uint i*/) tokenPayable {
        LogTokenPayable(1, tkn.addr, tkn.sender, tkn.value);
    }

    function () tokenPayable {
        LogTokenPayable(0, tkn.addr, tkn.sender, tkn.value);
    }

    function supportsToken() returns (bool) {
        return true;
    }

    event LogTokenPayable(uint i, address token, address sender, uint value);
}