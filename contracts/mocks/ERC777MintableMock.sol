pragma solidity ^0.5.0;

import "../token/ERC777/ERC777Mintable.sol";
import "./MinterRoleMock.sol";

contract ERC777MintableMock is ERC777Mintable, MinterRoleMock {
    // solhint-disable-previous-line no-empty-blocks
}
