// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./draft-IERC3156.sol";
import "../ERC20.sol";

/**
 * @dev TODO
 */
abstract contract ERC3156 is ERC20, IERC3156FlashLender {
    bytes32 constant internal RETURN_VALUE = keccak256("ERC3156FlashBorrower.onFlashLoan");

    function maxFlashLoan(address token) external view override returns (uint256) {
        return token == address(this) ? type(uint256).max - ERC20.totalSupply() : 0;
    }

    function flashFee(address /*token*/, uint256 /*amount*/) external pure override returns (uint256) {
        return 0;
    }

    function flashLoan(
        IERC3156FlashBorrower receiver,
        address token,
        uint256 amount,
        bytes calldata data
    )
    external override returns (bool)
    {
        require(token == address(this));
        // mint tokens - will revert on overflow
        _mint(address(receiver), amount);
        // call the flashLoan borrower
        require(receiver.onFlashLoan(msg.sender, token, amount, 0, data)  == RETURN_VALUE);
        // update approval (equivalent of burnFrom #1) - will revert on overflow
        _approve(address(receiver), address(this), allowance(msg.sender, address(this)) - amount);
        // burn tokens (equivalent of burnFrom #2)
        _burn(address(receiver), amount);
        return true;
    }
}
