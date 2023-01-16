// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../token/ERC20/ERC20.sol";
import "../../token/ERC20/extensions/draft-ERC20Permit.sol";

contract ERC20PermitNoRevertMock is ERC20, ERC20Permit {
    constructor() ERC20("ERC20PermitNoRevertMock", "ERC20PermitNoRevertMock") ERC20Permit("ERC20PermitNoRevertMock") {}

    function permitThatMayRevert(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        super.permit(owner, spender, value, deadline, v, r, s);
    }

    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual override {
        try this.permitThatMayRevert(owner, spender, value, deadline, v, r, s) {
            // do nothing
        } catch {
            // do nothing
        }
    }
}
