pragma solidity ^0.8.20;

import {ERC20Pausable} from "../../../../openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20} from "../../../../openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";

contract MyERC20Pausable is ERC20Pausable {

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        
    }

    function Pause() public {
        _pause();
    }

    function Unpause() public {
        _unpause();
    }
}