// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "../../utils/introspection/IERC165.sol";

contract ERC165ReturnBombMock is IERC165 {
    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        if (interfaceId == type(IERC165).interfaceId) {
            assembly {
                mstore(0, 1)
            }
        }
        assembly {
            return(0, 101500)
        }
    }
}
