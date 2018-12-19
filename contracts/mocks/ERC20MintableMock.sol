pragma solidity ^0.5.1;

import "../token/ERC20/ERC20Mintable.sol";
import "./MinterRoleMock.sol";

contract ERC20MintableMock is ERC20Mintable, MinterRoleMock {
}
