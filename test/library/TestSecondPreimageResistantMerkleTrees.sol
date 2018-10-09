pragma solidity ^0.4.24;

import "truffle/Assert.sol";
import "../../contracts/cryptography/SecondPreimageResistantMerkleTrees.sol";


contract TestSecondPreimageResistantMerkleTrees {

  bytes constant L0 = "p";
  bytes constant L1 = "rrr";
  bytes constant L2 = "ssss";
  bytes constant L3 = "qq";
  bytes constant L4 = "ttttt";

  function testComputeRootOfTreeOfSize1() public {
    testComputeRootOfTreeOfSize(1, h(L0));
  }

  function testComputeRootOfTreeOfSize2() public {
    testComputeRootOfTreeOfSize(2, h(h(L0), h(L1)));
  }

  function testComputeRootOfTreeOfSize3() public {
    testComputeRootOfTreeOfSize(3, h(h(h(L0), h(L1)), h(L2)));
  }

  function testComputeRootOfTreeOfSize4() public {
    testComputeRootOfTreeOfSize(4, h(h(h(L0), h(L1)), h(h(L2), h(L3))));
  }

  function testComputeRootOfTreeOfSize5() public {
    testComputeRootOfTreeOfSize(
      5,
      h(h(h(h(L0), h(L1)), h(h(L2), h(L3))), h(L4))
    );
  }

  function h(bytes leaf) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(bytes1(0x00), leaf));
  }

  function h(bytes32 node1, bytes32 node2) internal pure returns (bytes32) {
    return keccak256(
      node1 < node2
        ? abi.encodePacked(bytes1(0x01), node1, node2)
        : abi.encodePacked(bytes1(0x01), node2, node1)
    );
  }

  using MerkleTrees for MerkleTrees.Tree;

  function testComputeRootOfTreeOfSize(uint256 size, bytes32 expectedRoot)
    internal
  {
    // solium-disable-next-line arg-overflow
    bytes[5] memory allLeaves = [L0, L1, L2, L3, L4];

    // solium-disable-next-line max-len
    MerkleTrees.Tree memory tree = SecondPreimageResistantMerkleTrees.newTree(size);

    for (uint256 i = 0; i < size; i++) {
      tree.setLeafDataBlock(i, allLeaves[i]);
    }

    Assert.equal(tree.computeRoot(), expectedRoot, "computed != expected");
  }

}
