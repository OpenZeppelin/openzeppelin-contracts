pragma solidity ^0.4.18;

import "../math/SafeMath.sol";


/**
 * @title Proposable
 * @dev parties can extend generic `Proposal`s to be voted upon and eventually executed or closed
 */
contract Proposable {
  using SafeMath for uint;

  enum Actions { Accept, Pend, Reject }  // possible outcomes of the voting process
  enum Status { Null, Accepted, Closed, Executed, Open }  // possible states of a `Proposal`

  struct Proposal {
    /**
     * a `Proposal` is uniquely identified by a `keccak256()` hash of the following information...
     */

    uint sendValue;  // for example: send `100`
    string sendDescription;  // 'tokens'
    address to;  // to `0xdead...`

    uint forValue;  // for `1`
    string forDescription;  // 'ETH'
    address from;  // from `0xdead...`

    string ipfs;
    address proposedBy;

    address[] directed;

    /**
     * meta-data (not included in hash)
     */

    Status status;
    uint tallyFor;
    uint tallyAgainst;

    mapping(address => bool) directedTowards;
    mapping (address => bool) voters;
  }

  mapping(bytes32 => Proposal) public proposals;  // all unique `Proposal`s

  event ProposalExtended(bytes32 indexed proposal, address indexed by);
  event Voted(bytes32 indexed proposal, address indexed voter);
  event ProposalAccepted(bytes32 indexed proposal);
  event ProposalRejected(bytes32 indexed proposal);
  event ProposalClosed(bytes32 indexed proposal);  // emitted by abstract method `closeProposal()`
  event ProposalExecuted(bytes32 indexed proposal);  // emitted by abstract method `executeProposal()`

  /**
   * @dev get the voting influence/power of a party
   * @param voter address of the voting party
   * @dev this may revert if `voter` is not `WhiteList`ed or has no clout
   */
  function getClout(address voter) view internal returns (uint clout);

  /**
   * @dev indicate an `Action` to take based on the current state of a `Proposal`'s voting process
   * @param tallyFor current vote count in favor of this `Proposal`
   * @param tallyAgainst current vote count in opposition of this `Proposal`
   */
  function tallyVotes(uint tallyFor, uint tallyAgainst) view internal returns (Actions action);

  /**
   * @dev close a `Proposal` (it is either `Rejected` via vote or rescinded by `Proposal.proposedBy`)
   * @param hash unique identifier of the `Proposal` being `Closed`
   */
  function closeProposal(bytes32 hash) internal;

  /**
   * @dev execute a proposal (it has been `Accepted` via vote)
   * @param hash unique identifier of the `Proposal` being executed
   */
  function executeProposal(bytes32 hash) internal;

  /**
   * inheriting contract can optionally restrict `extendProposal()` and `vote()` by overriding these modifiers
   */

  modifier extendProposalFilter {
    _;
  }

  modifier voteFilter {
    _;
  }

  /**
  * @dev extend a `Proposal` to be voted upon and eventually `Executed` or `Closed`
  * @param sendValue the value this `Proposal` is proposing to send (i.e. 100) (units defined by inheriting contract)
  * @param sendDescription human-readable description of `sendValue` (i.e. 'tokens')
  * @param to address receiving `sendValue`
  * @param forValue the value being received in exchange for `sendValue` (i.e. 1) (units defined by inheriting contract)
  * @param forDescription human-readable description of `forValue` (i.e. 'ETH')
  * @param from address providing `forValue`
  * @param ipfs hash of off-chain data relevant to this proposal
  * @param directed addresses this proposal is directed towards (empty indicates an undirected `Proposal`)
  */
  function extendProposal(
    uint sendValue,
    string sendDescription,
    address to,
    uint forValue,
    string forDescription,
    address from,
    string ipfs,
    address[] directed
  )
    public
    extendProposalFilter
  {
    bytes32 hash = keccak256(sendValue, sendDescription, to, forValue, forDescription, from, ipfs, msg.sender, directed);
    require(proposals[hash].status == Status.Null);

    proposals[hash] = Proposal(sendValue, sendDescription, to, forValue, forDescription, from, ipfs, msg.sender, directed, Status.Open, 0, 0);
    for (uint i = 0; i < directed.length; i++) {
      proposals[hash].directedTowards[directed[i]] = true;
    }

    ProposalExtended(hash, msg.sender);
  }

  /**
   * @dev a party can rescind (close) a `Proposal` they've extended (until it has been `Accepted` via the voting process)
   * @param hash unique identifier of the `Proposal` being rescinded
   */
  function rescindProposal(bytes32 hash) public {
    require(msg.sender == proposals[hash].proposedBy);
    closeProposal(hash);
  }

  /**
   * @dev a party can vote on `Open` `Proposal`s
   * @param hash unique identifier of the `Proposal` being voted on
   * @param inSupport `true` indicates yea, `false` indicates nay
   */
  function vote(bytes32 hash, bool inSupport) voteFilter public {
    Proposal storage proposal = proposals[hash];
    require(proposal.status == Status.Open);

    if (proposal.directed.length > 0) {
      require(proposal.directedTowards[msg.sender]);
    }

    require(!proposal.voters[msg.sender]);
    proposal.voters[msg.sender] = true;

    if (inSupport) {
      proposal.tallyFor += getClout(msg.sender);
    } else {
      proposal.tallyAgainst += getClout(msg.sender);
    }

    Voted(hash, msg.sender);

    Actions action = tallyVotes(proposal.tallyFor, proposal.tallyAgainst);
    if (action == Actions.Accept) {
      proposal.status = Status.Accepted;
      ProposalAccepted(hash);
      executeProposal(hash);
    } else if (action == Actions.Reject) {
      ProposalRejected(hash);
      closeProposal(hash);
    }
  }
}
