const { writeFileSync } = require('fs');
const { join } = require('path');

const executeBatchTemplate = batchSize => `
contract ERC2771ForwarderExecuteBatch${(batchSize + 1).toString().padStart(3, '0')}Test is ERC2771ForwarderTest {
  uint256 batchSize = ${batchSize + 1};

  function testExecuteBatch() public {
      ERC2771Forwarder.ForwardRequestData[] memory batchRequestDatas = new ERC2771Forwarder.ForwardRequestData[](
          batchSize
      );

      for (uint i; i < batchSize; ++i) {
          batchRequestDatas[i] = requestDatas[i];
      }

      _erc2771Forwarder.executeBatch(batchRequestDatas, true);
  }
}
`;

const executeTemplate = `
contract ERC2771ForwarderExecuteTest is ERC2771ForwarderTest {
  function testExecute() public {
      (bool success, ) = _erc2771Forwarder.execute(requestDatas[0]);
      assertTrue(success);
  }
}`;

const template = maxSize => `
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "contracts/metatx/ERC2771Forwarder.sol";

struct ForwardRequest {
    address from;
    address to;
    uint256 value;
    uint256 gas;
    uint256 nonce;
    uint48 deadline;
    bytes data;
}

contract ERC2771Target {
    function test() external {}
}

contract ERC2771ForwarderMock is ERC2771Forwarder {
    constructor(string memory name) ERC2771Forwarder(name) {}

    bytes32 private constant _FORWARD_REQUEST_TYPEHASH =
        keccak256(
            "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,uint48 deadline,bytes data)"
        );

    function structHash(ForwardRequest calldata request) external view returns (bytes32) {
        return
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        _FORWARD_REQUEST_TYPEHASH,
                        request.from,
                        request.to,
                        request.value,
                        request.gas,
                        request.nonce,
                        request.deadline,
                        keccak256(request.data)
                    )
                )
            );
    }
}

contract ERC2771ForwarderTest is Test {
    ERC2771ForwarderMock internal _erc2771Forwarder;
    ERC2771Target internal _target;

    uint256 internal _signerPrivateKey;
    uint256 internal _relayerPrivateKey;

    address internal _signer;
    address internal _relayer;

    ERC2771Forwarder.ForwardRequestData[] requestDatas;

    function setUp() public {
        _erc2771Forwarder = new ERC2771ForwarderMock("ERC2771Forwarder");
        _target = new ERC2771Target();

        _signerPrivateKey = 0xA11CE;
        _relayerPrivateKey = 0xB0B;

        _signer = vm.addr(_signerPrivateKey);
        _relayer = vm.addr(_relayerPrivateKey);

        uint256 nonce = _erc2771Forwarder.nonces(_signer);

        for (uint256 i; i < ${maxSize}; ++i) {
            requestDatas.push(_forgeRequestData(nonce + i));
        }
    }

    function _forgeRequestData(
        uint256 nonce
    ) private view returns (ERC2771Forwarder.ForwardRequestData memory _requestData) {
        ForwardRequest memory request = ForwardRequest({
            from: _signer,
            to: address(_target),
            value: 0,
            gas: 30000,
            nonce: nonce,
            deadline: uint48(block.timestamp + 1),
            data: abi.encodeCall(ERC2771Target.test, ())
        });

        bytes32 digest = _erc2771Forwarder.structHash(request);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(_signerPrivateKey, digest);
        bytes memory signature = abi.encodePacked(r, s, v);

        _requestData = ERC2771Forwarder.ForwardRequestData({
            from: request.from,
            to: request.to,
            value: request.value,
            gas: request.gas,
            deadline: request.deadline,
            data: request.data,
            signature: signature
        });
    }
}

${executeTemplate}

${new Array(maxSize)
  .fill()
  .map((_, i) => executeBatchTemplate(i))
  .join('\n')}
`;

const run = () => {
  writeFileSync(join(__dirname, 'test', 'metatx', 'ERC2771Forwarder.t.sol'), template(500));
};

run();
