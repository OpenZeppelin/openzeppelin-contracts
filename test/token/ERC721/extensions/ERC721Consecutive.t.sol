// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

// solhint-disable func-name-mixedcase

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Consecutive} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Consecutive.sol";
import {Test, StdUtils} from "forge-std/Test.sol";

function toSingleton(address account) pure returns (address[] memory) {
    address[] memory accounts = new address[](1);
    accounts[0] = account;
    return accounts;
}

contract ERC721ConsecutiveTarget is StdUtils, ERC721Consecutive {
    uint96 private immutable _offset;
    uint256 private _totalMinted = 0;

    constructor(address[] memory receivers, uint256[] memory batches, uint256 startingId) ERC721("", "") {
        _offset = uint96(startingId);
        for (uint256 i = 0; i < batches.length; i++) {
            address receiver = receivers[i % receivers.length];
            uint96 batchSize = uint96(bound(batches[i], 0, _maxBatchSize()));
            _mintConsecutive(receiver, batchSize);
            _totalMinted += batchSize;
        }
    }

    function totalMinted() public view returns (uint256) {
        return _totalMinted;
    }

    function burn(uint256 tokenId) public {
        _burn(tokenId);
    }

    function _firstConsecutiveId() internal view virtual override returns (uint96) {
        return _offset;
    }
}

contract ERC721ConsecutiveTest is Test {
    function test_balance(address receiver, uint256[] calldata batches, uint96 startingId) public {
        vm.assume(receiver != address(0));

        uint256 startingTokenId = bound(startingId, 0, 5000);

        ERC721ConsecutiveTarget token = new ERC721ConsecutiveTarget(toSingleton(receiver), batches, startingTokenId);

        assertEq(token.balanceOf(receiver), token.totalMinted());
    }

    function test_ownership(
        address receiver,
        uint256[] calldata batches,
        uint256[2] calldata unboundedTokenId,
        uint96 startingId
    ) public {
        vm.assume(receiver != address(0));

        uint256 startingTokenId = bound(startingId, 0, 5000);

        ERC721ConsecutiveTarget token = new ERC721ConsecutiveTarget(toSingleton(receiver), batches, startingTokenId);

        if (token.totalMinted() > 0) {
            uint256 validTokenId = bound(
                unboundedTokenId[0],
                startingTokenId,
                startingTokenId + token.totalMinted() - 1
            );
            assertEq(token.ownerOf(validTokenId), receiver);
        }

        uint256 invalidTokenId = bound(
            unboundedTokenId[1],
            startingTokenId + token.totalMinted(),
            startingTokenId + token.totalMinted() + 1
        );
        vm.expectRevert();
        token.ownerOf(invalidTokenId);
    }

    function test_burn(
        address receiver,
        uint256[] calldata batches,
        uint256 unboundedTokenId,
        uint96 startingId
    ) public {
        vm.assume(receiver != address(0));

        uint256 startingTokenId = bound(startingId, 0, 5000);

        ERC721ConsecutiveTarget token = new ERC721ConsecutiveTarget(toSingleton(receiver), batches, startingTokenId);

        // only test if we minted at least one token
        uint256 supply = token.totalMinted();
        vm.assume(supply > 0);

        // burn a token in [0; supply[
        uint256 tokenId = bound(unboundedTokenId, startingTokenId, startingTokenId + supply - 1);
        token.burn(tokenId);

        // balance should have decreased
        assertEq(token.balanceOf(receiver), supply - 1);

        // token should be burnt
        vm.expectRevert();
        token.ownerOf(tokenId);
    }

    function test_transfer(
        address[2] calldata accounts,
        uint256[2] calldata unboundedBatches,
        uint256[2] calldata unboundedTokenId,
        uint96 startingId
    ) public {
        vm.assume(accounts[0] != address(0));
        vm.assume(accounts[1] != address(0));
        vm.assume(accounts[0] != accounts[1]);

        uint256 startingTokenId = bound(startingId, 1, 5000);

        address[] memory receivers = new address[](2);
        receivers[0] = accounts[0];
        receivers[1] = accounts[1];

        // We assume _maxBatchSize is 5000 (the default). This test will break otherwise.
        uint256[] memory batches = new uint256[](2);
        batches[0] = bound(unboundedBatches[0], startingTokenId, 5000);
        batches[1] = bound(unboundedBatches[1], startingTokenId, 5000);

        ERC721ConsecutiveTarget token = new ERC721ConsecutiveTarget(receivers, batches, startingTokenId);

        uint256 tokenId0 = bound(unboundedTokenId[0], startingTokenId, batches[0]);
        uint256 tokenId1 = bound(unboundedTokenId[1], startingTokenId, batches[1]) + batches[0];

        assertEq(token.ownerOf(tokenId0), accounts[0]);
        assertEq(token.ownerOf(tokenId1), accounts[1]);
        assertEq(token.balanceOf(accounts[0]), batches[0]);
        assertEq(token.balanceOf(accounts[1]), batches[1]);

        vm.prank(accounts[0]);
        // forge-lint: disable-next-line(erc20-unchecked-transfer)
        token.transferFrom(accounts[0], accounts[1], tokenId0);

        assertEq(token.ownerOf(tokenId0), accounts[1]);
        assertEq(token.ownerOf(tokenId1), accounts[1]);
        assertEq(token.balanceOf(accounts[0]), batches[0] - 1);
        assertEq(token.balanceOf(accounts[1]), batches[1] + 1);

        vm.prank(accounts[1]);
        // forge-lint: disable-next-line(erc20-unchecked-transfer)
        token.transferFrom(accounts[1], accounts[0], tokenId1);

        assertEq(token.ownerOf(tokenId0), accounts[1]);
        assertEq(token.ownerOf(tokenId1), accounts[0]);
        assertEq(token.balanceOf(accounts[0]), batches[0]);
        assertEq(token.balanceOf(accounts[1]), batches[1]);
    }

    function test_start_consecutive_id(
        address receiver,
        uint256[2] calldata unboundedBatches,
        uint256[2] calldata unboundedTokenId,
        uint96 startingId
    ) public {
        vm.assume(receiver != address(0));

        uint256 startingTokenId = bound(startingId, 1, 5000);

        // We assume _maxBatchSize is 5000 (the default). This test will break otherwise.
        uint256[] memory batches = new uint256[](2);
        batches[0] = bound(unboundedBatches[0], startingTokenId, 5000);
        batches[1] = bound(unboundedBatches[1], startingTokenId, 5000);

        ERC721ConsecutiveTarget token = new ERC721ConsecutiveTarget(toSingleton(receiver), batches, startingTokenId);

        uint256 tokenId0 = bound(unboundedTokenId[0], startingTokenId, batches[0]);
        uint256 tokenId1 = bound(unboundedTokenId[1], startingTokenId, batches[1]);

        assertEq(token.ownerOf(tokenId0), receiver);
        assertEq(token.ownerOf(tokenId1), receiver);
        assertEq(token.balanceOf(receiver), batches[0] + batches[1]);
    }
}
