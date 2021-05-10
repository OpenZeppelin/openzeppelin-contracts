// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../token/ERC20/extensions/IComp.sol";
import "../utils/cryptography/draft-EIP712.sol";
import "../governance/Governor.sol";

contract GovernanceMock is Governor, EIP712 {
    bytes32 private constant _BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");

    IComp immutable internal _token;

    constructor(string memory name_, string memory version_, IComp token_)
    EIP712(name_, version_)
    {
        _token = token_;
    }

    receive() external payable {}

    function token()          public view          returns (IComp)   { return _token; }
    function votingOffset()   public pure override returns (uint256) { return 0;      }
    function votingDuration() public pure override returns (uint256) { return 10;     } // FOR TESTING ONLY
    function quorum()         public pure override returns (uint256) { return 1;      }
    function maxScore()       public pure override returns (uint8)   { return 100;    } // default: 255 ?
    function requiredScore()  public pure override returns (uint8)   { return 50;     } // default: 128 ?

    function getVotes(address account, uint256 blockNumber) public view virtual override returns(uint256) {
        return _token.getPriorVotes(account, blockNumber);
    }

    function propose(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    public returns (bytes32)
    {
        return _propose(target, value, data, salt);
    }

    function execute(
        address[] calldata target,
        uint256[] calldata value,
        bytes[] calldata data,
        bytes32 salt
    )
    public returns (bytes32)
    {
        return _execute(target, value, data, salt);
    }

    function castVote(uint256 proposalId, uint8 support)
    public
    {
        _castVote(bytes32(proposalId), _msgSender(), support);
    }

    function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s)
    public
    {
        address voter = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encodePacked(_BALLOT_TYPEHASH, proposalId, support))),
            v, r, s
        );
        _castVote(bytes32(proposalId), voter, support);
    }
}
