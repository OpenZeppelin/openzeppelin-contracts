const { expect } = require('chai');
const { interfaceId } = require('../../helpers/methods');
const { mapValues } = require('../../helpers/iterate');

const INVALID_ID = '0xffffffff';
const GOVERNOR_INTERFACE = [
  'name()',
  'version()',
  'COUNTING_MODE()',
  'hashProposal(address[],uint256[],bytes[],bytes32)',
  'state(uint256)',
  'proposalThreshold()',
  'proposalSnapshot(uint256)',
  'proposalDeadline(uint256)',
  'proposalProposer(uint256)',
  'proposalEta(uint256)',
  'proposalNeedsQueuing(uint256)',
  'votingDelay()',
  'votingPeriod()',
  'quorum(uint256)',
  'getVotes(address,uint256)',
  'getVotesWithParams(address,uint256,bytes)',
  'hasVoted(uint256,address)',
  'propose(address[],uint256[],bytes[],string)',
  'queue(address[],uint256[],bytes[],bytes32)',
  'execute(address[],uint256[],bytes[],bytes32)',
  'cancel(address[],uint256[],bytes[],bytes32)',
  'castVote(uint256,uint8)',
  'castVoteWithReason(uint256,uint8,string)',
  'castVoteWithReasonAndParams(uint256,uint8,string,bytes)',
  'castVoteBySig(uint256,uint8,address,bytes)',
  'castVoteWithReasonAndParamsBySig(uint256,uint8,address,string,bytes,bytes)',
];
const SIGNATURES = {
  ERC165: ['supportsInterface(bytes4)'],
  ERC721: [
    'balanceOf(address)',
    'ownerOf(uint256)',
    'approve(address,uint256)',
    'getApproved(uint256)',
    'setApprovalForAll(address,bool)',
    'isApprovedForAll(address,address)',
    'transferFrom(address,address,uint256)',
    'safeTransferFrom(address,address,uint256)',
    'safeTransferFrom(address,address,uint256,bytes)',
  ],
  ERC721Enumerable: ['totalSupply()', 'tokenOfOwnerByIndex(address,uint256)', 'tokenByIndex(uint256)'],
  ERC721Metadata: ['name()', 'symbol()', 'tokenURI(uint256)'],
  ERC1155: [
    'balanceOf(address,uint256)',
    'balanceOfBatch(address[],uint256[])',
    'setApprovalForAll(address,bool)',
    'isApprovedForAll(address,address)',
    'safeTransferFrom(address,address,uint256,uint256,bytes)',
    'safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)',
  ],
  ERC1155MetadataURI: ['uri(uint256)'],
  ERC1155Receiver: [
    'onERC1155Received(address,address,uint256,uint256,bytes)',
    'onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)',
  ],
  ERC1363: [
    'transferAndCall(address,uint256)',
    'transferAndCall(address,uint256,bytes)',
    'transferFromAndCall(address,address,uint256)',
    'transferFromAndCall(address,address,uint256,bytes)',
    'approveAndCall(address,uint256)',
    'approveAndCall(address,uint256,bytes)',
  ],
  AccessControl: [
    'hasRole(bytes32,address)',
    'getRoleAdmin(bytes32)',
    'grantRole(bytes32,address)',
    'revokeRole(bytes32,address)',
    'renounceRole(bytes32,address)',
  ],
  AccessControlEnumerable: ['getRoleMember(bytes32,uint256)', 'getRoleMemberCount(bytes32)'],
  AccessControlDefaultAdminRules: [
    'defaultAdminDelay()',
    'pendingDefaultAdminDelay()',
    'defaultAdmin()',
    'pendingDefaultAdmin()',
    'defaultAdminDelayIncreaseWait()',
    'changeDefaultAdminDelay(uint48)',
    'rollbackDefaultAdminDelay()',
    'beginDefaultAdminTransfer(address)',
    'acceptDefaultAdminTransfer()',
    'cancelDefaultAdminTransfer()',
  ],
  Governor: GOVERNOR_INTERFACE,
  Governor_5_3: GOVERNOR_INTERFACE.concat('getProposalId(address[],uint256[],bytes[],bytes32)'),
  ERC2981: ['royaltyInfo(uint256,uint256)'],
  ERC6909: [
    'balanceOf(address,uint256)',
    'allowance(address,address,uint256)',
    'isOperator(address,address)',
    'transfer(address,uint256,uint256)',
    'transferFrom(address,address,uint256,uint256)',
    'approve(address,uint256,uint256)',
    'setOperator(address,bool)',
  ],
  ERC6909TokenSupply: ['totalSupply(uint256)'],
  ERC6909Metadata: ['name(uint256)', 'symbol(uint256)', 'decimals(uint256)'],
  ERC6909ContentURI: ['contractURI()', 'tokenURI(uint256)'],
};

const INTERFACE_IDS = mapValues(SIGNATURES, interfaceId);

function shouldSupportInterfaces(interfaces = [], signatures = SIGNATURES) {
  // case where only signatures are provided
  if (!Array.isArray(interfaces)) {
    signatures = interfaces;
    interfaces = Object.keys(interfaces);
  }

  interfaces.unshift('ERC165');
  signatures.ERC165 = SIGNATURES.ERC165;
  const interfaceIds = mapValues(signatures, interfaceId, ([name]) => interfaces.includes(name));

  describe('ERC165', function () {
    beforeEach(function () {
      this.contractUnderTest = this.mock || this.token;
    });

    describe('when the interfaceId is supported', function () {
      it('uses less than 30k gas', async function () {
        for (const k of interfaces) {
          const interfaceId = interfaceIds[k] ?? k;
          expect(await this.contractUnderTest.supportsInterface.estimateGas(interfaceId)).to.lte(30_000n);
        }
      });

      it('returns true', async function () {
        for (const k of interfaces) {
          const interfaceId = interfaceIds[k] ?? k;
          expect(await this.contractUnderTest.supportsInterface(interfaceId), `does not support ${k}`).to.be.true;
        }
      });
    });

    describe('when the interfaceId is not supported', function () {
      it('uses less than 30k', async function () {
        expect(await this.contractUnderTest.supportsInterface.estimateGas(INVALID_ID)).to.lte(30_000n);
      });

      it('returns false', async function () {
        expect(await this.contractUnderTest.supportsInterface(INVALID_ID), `supports ${INVALID_ID}`).to.be.false;
      });
    });

    it('all interface functions are in ABI', async function () {
      for (const k of interfaces) {
        // skip interfaces for which we don't have a function list
        if (signatures[k] === undefined) continue;

        // Check the presence of each function in the contract's interface
        for (const fnSig of signatures[k]) {
          expect(this.contractUnderTest.interface.hasFunction(fnSig), `did not find ${fnSig}`).to.be.true;
        }
      }
    });
  });
}

module.exports = {
  SIGNATURES,
  INTERFACE_IDS,
  shouldSupportInterfaces,
};
