pragma solidity ^0.8.20;

import {ERC20} from "../../../openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "../../../openzeppelin-contracts/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "../../../openzeppelin-contracts/contracts/token/ERC20/IERC20.sol";

contract MyERC20 is ERC20 {
    constructor(address acc, string memory name_, string memory symbol_) ERC20(name_, symbol_) {
        _mint(acc, 100);
    }
}

contract MySafeERC20 {
    address public erc20;
    constructor() {
        erc20 = address(new MyERC20(address(this), "ma", "m"));
    }

    function safeTransfer(address to, uint256 value) public {
        SafeERC20.safeTransfer(IERC20(erc20), to, value);
    }

    function safeTransferFrom(address from, address to, uint256 value) public {
        SafeERC20.safeTransferFrom(IERC20(erc20), from, to, value);
    }

    function safeIncreaseAllowance(address spender, uint256 value) public {
        SafeERC20.safeIncreaseAllowance(IERC20(erc20), spender, value);
    }

    function safeDecreaseAllowance(address spender, uint256 value) public {
        SafeERC20.safeDecreaseAllowance(IERC20(erc20), spender, value);
    }
}