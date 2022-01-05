// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC721/extensions/IERC721Rent.sol";

contract ERC721RentAgreementMock is IERC721RentAgreement {
    bool private _fail;

    // Interface
    function afterRentAgreementReplaced(uint256) external view override {
        require(!_fail, "Failed from agreement contract");
    }

    function afterRentStarted(
        address,
        address,
        uint256
    ) external view override {
        require(!_fail, "Failed from agreement contract");
    }

    function afterRentStopped(address, uint256) external view override {
        require(!_fail, "Failed from agreement contract");
    }

    function supportsInterface(bytes4) external pure override returns (bool) {
        return true;
    }

    // For the test
    function setFail(bool fail) public {
        _fail = fail;
    }
}
