pragma solidity ^0.4.24;

import "../Initializable.sol";
import "../examples/SimpleToken.sol";

contract SimpleTokenMock is Initializable, SimpleToken {
  constructor() public {
    SimpleToken.initialize();
  }
}
