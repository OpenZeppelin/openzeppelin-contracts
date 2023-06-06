pragma solidity ^0.8.19;

import "../token/ERC721/IERC721Receiver.sol";
import "../token/ERC1155/IERC1155Receiver.sol";
import "../utils/cryptography/ECDSA.sol";
import "../utils/cryptography/EIP712.sol";
import "../utils/introspection/ERC165.sol";
import "../utils/math/SafeCast.sol";
import "../utils/structs/DoubleEndedQueue.sol";
import "../utils/Address.sol";
import "../utils/Context.sol";
import "./IGovernor.sol";

abstract contract Governor is Context, ERC165, EIP712, IGovernor, IERC721Receiver, IERC1155Receiver {
    using DoubleEndedQueue for DoubleEndedQueue.Bytes32Deque;

    bytes32 public constant BALLOT_TYPEHASH = keccak256("Ballot(uint256 proposalId,uint8 support)");
    bytes32 public constant EXTENDED_BALLOT_TYPEHASH =
        keccak256("ExtendedBallot(uint256 proposalId,uint8 support,string reason,bytes params)");

    struct ProposalCore {
        uint64 voteStart;
        address proposer;
        uint64 voteEnd;
        bool executed;
        bool canceled;
    }

    string private _name;

    mapping(uint256 => ProposalCore) private _proposals;
    mapping(uint256 => uint256) private _voteCounts;
    mapping(uint256 => mapping(address => bool)) private _voters;
    mapping(uint256 => bool) private _votingStatus;
    mapping(uint256 => bool) private _executionStatus;

    DoubleEndedQueue.Bytes32Deque private _governanceCall;

    event ProposalCreated(uint256 proposalId, address proposer);
    event VoteCast(uint256 proposalId, address voter);
    event ProposalExecuted(uint256 proposalId);
    event ProposalCanceled(uint256 proposalId);

    modifier proposalExists(uint256 proposalId) {
        require(_proposals[proposalId].voteStart != 0, "Governor: proposal does not exist");
        _;
    }

    modifier onlyGovernance() {
        require(msg.sender == _executor(), "Governor: onlyGovernance");
        if (_executor() != address(this)) {
            bytes32 msgDataHash = keccak256(_msgData());
            while (_governanceCall.popFront() != msgDataHash) {}
        }
        _;
        
    }

    // Import necessary libraries and contracts

contract BetterGovernance is IGovernor, EIP712 {
    // Define contract variables and data structures
    
    constructor(string memory name_) EIP712(name_, version()) {
        _name = name_;
    }

    // Implement the receive function to handle ETH sent to the contract
    
    receive() external payable virtual {
        require(_executor() == address(this), "Governor: must send to executor");
    }

    // Implement the supportsInterface function
    
    function supportsInterface(bytes4 interfaceId) public view virtual override(IERC165, ERC165) returns (bool) {
        // Include the necessary interface IDs for compatibility checks
        
        return super.supportsInterface(interfaceId);
    }

    // Implement the name function
    
    function name() public view virtual override returns (string memory) {
        return _name;
    }

    // Implement the version function
    
    function version() public view virtual override returns (string memory) {
        return "1";
    }

    // Implement the hashProposal function
    
    function hashProposal(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) public pure virtual override returns (uint256) {
        return uint256(keccak256(abi.encode(targets, values, calldatas, descriptionHash)));
    }

    // Implement the state function
    
    function state(uint256 proposalId) public view virtual override returns (ProposalState) {
        // Implement the state logic based on proposal data
        
        return ProposalState.Unknown;
    }

    // Implement the proposalThreshold function
    
    function proposalThreshold() public view virtual override returns (uint256) {
        return 0;
    }

    // Implement the proposalSnapshot function
    
    function proposalSnapshot(uint256 proposalId) public view virtual override returns (uint256) {
        // Implement the proposal snapshot logic
        
        return 0;
    }

    // Implement the proposalDeadline function
    
    function proposalDeadline(uint256 proposalId) public view virtual override returns (uint256) {
        // Implement the proposal deadline logic
        
        return 0;
    }

    // Implement the proposalProposer function
    
    function proposalProposer(uint256 proposalId) public view virtual override returns (address) {
        // Implement the proposal proposer logic
        
        return address(0);
    }

    // Implement internal functions _quorumReached, _voteSucceeded, _getVotes, and _countVote
    
    function _quorumReached(uint256 proposalId) internal view virtual returns (bool) {
        // Implement the logic to check if the quorum has been reached
        
        return false;
    }

    function _voteSucceeded(uint256 proposalId) internal view virtual returns (bool) {
        // Implement the logic to check if the vote succeeded
        
        return false;
    }

    function _getVotes(address account, uint256 timepoint, bytes memory params) internal view virtual returns (uint256) {
        // Implement the logic to get the voting weight of an account
        
        return 0;
    }

    function _countVote(
        uint256 proposalId,
        address account,
        uint8 support,
        uint256 weight,
        bytes memory params
    ) internal virtual {
        // Implement the logic to count votes
        
    }
}


 /**
 * @dev Default additional encoded parameters used by castVote methods that don't include them
 *
 * Note: Should be overridden by specific implementations to use an appropriate value, the
 * meaning of the additional params, in the context of that implementation
 */
function _defaultParams() internal view virtual returns (bytes memory) {
    return "";
}

/**
 * @dev See {IGovernor-propose}.
 */
function propose(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    string memory description
) public virtual override returns (uint256) {
    address proposer = _msgSender();
    uint256 currentTimepoint = clock();

    require(
        _getVotes(proposer, currentTimepoint - 1, _defaultParams()) >= proposalThreshold(),
        "Governor: proposer votes below proposal threshold"
    );

    uint256 proposalId = hashProposal(targets, values, calldatas, keccak256(bytes(description)));

    require(targets.length == values.length, "Governor: invalid proposal length");
    require(targets.length == calldatas.length, "Governor: invalid proposal length");
    require(targets.length > 0, "Governor: empty proposal");
    require(_proposals[proposalId].voteStart == 0, "Governor: proposal already exists");

    uint256 snapshot = currentTimepoint + votingDelay();
    uint256 deadline = snapshot + votingPeriod();

    _proposals[proposalId] = ProposalCore({
        proposer: proposer,
        voteStart: SafeCast.toUint64(snapshot),
        voteEnd: SafeCast.toUint64(deadline),
        executed: false,
        canceled: false,
        __gap_unused0: 0,
        __gap_unused1: 0
    });

    emit ProposalCreated(
        proposalId,
        proposer,
        targets,
        values,
        new string[](targets.length),
        calldatas,
        snapshot,
        deadline,
        description
    );

    return proposalId;
}

/**
 * @dev See {IGovernor-execute}.
 */
function execute(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
) public payable virtual override returns (uint256) {
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    ProposalState currentState = state(proposalId);
    require(
        currentState == ProposalState.Succeeded || currentState == ProposalState.Queued,
        "Governor: proposal not successful"
    );
    require(!_proposals[proposalId].executed, "Governor: proposal already executed");

    _proposals[proposalId].executed = true;

    emit ProposalExecuted(proposalId);

    _beforeExecute(proposalId, targets, values, calldatas, descriptionHash);
    _execute(proposalId, targets, values, calldatas, descriptionHash);
    _afterExecute(proposalId, targets, values, calldatas, descriptionHash);

    return proposalId;
}

/**
 * @dev See {IGovernor-cancel}.
 */
function cancel(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
) public virtual override returns (uint256) {
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);
    require(state(proposalId) == ProposalState.Pending, "Governor: too late to cancel");
    require(_msgSender() == _proposals[proposalId].proposer, "Governor: only proposer can cancel");

    return _cancel(targets, values, calldatas, descriptionHash);
}

/**
 * @dev Internal execution mechanism. Can be overridden to implement different execution mechanism
 */
function _execute(
    uint256 proposalId,
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
) internal virtual {
    string memory errorMessage = "Governor: call reverted without message";
    for (uint256 i = 0; i < targets.length; ++i) {
        (bool success, bytes memory returndata) = targets[i].call{value: values[i]}(calldatas[i]);
        Address.verifyCallResult(success, returndata, errorMessage);
    }
}


   /**
 * @dev Hook before execution is triggered.
 */
function _beforeExecute(
    uint256 /* proposalId */,
    address[] memory targets,
    uint256[] memory /* values */,
    bytes[] memory calldatas,
    bytes32 /*descriptionHash*/
) internal virtual {
    if (_executor() != address(this)) {
        for (uint256 i = 0; i < targets.length; ++i) {
            if (targets[i] == address(this)) {
                _governanceCall.pushBack(keccak256(calldatas[i]));
            }
        }
    }
}

/**
 * @dev Hook after execution is triggered.
 */
function _afterExecute(
    uint256 /* proposalId */,
    address[] memory /* targets */,
    uint256[] memory /* values */,
    bytes[] memory /* calldatas */,
    bytes32 /*descriptionHash*/
) internal virtual {
    if (_executor() != address(this)) {
        if (!_governanceCall.empty()) {
            _governanceCall.clear();
        }
    }
}

/**
 * @dev Internal cancel mechanism: locks up the proposal timer, preventing it from being re-submitted. Marks it as
 * canceled to allow distinguishing it from executed proposals.
 *
 * Emits a {IGovernor-ProposalCanceled} event.
 */
function _cancel(
    address[] memory targets,
    uint256[] memory values,
    bytes[] memory calldatas,
    bytes32 descriptionHash
) internal virtual returns (uint256) {
    uint256 proposalId = hashProposal(targets, values, calldatas, descriptionHash);

    ProposalState currentState = state(proposalId);

    require(
        currentState != ProposalState.Canceled &&
            currentState != ProposalState.Expired &&
            currentState != ProposalState.Executed,
        "Governor: proposal not active"
    );
    _proposals[proposalId].canceled = true;

    emit ProposalCanceled(proposalId);

    return proposalId;
}

/**
 * @dev See {IGovernor-getVotes}.
 */
function getVotes(address account, uint256 timepoint) public view virtual override returns (uint256) {
    return _getVotes(account, timepoint, _defaultParams());
}

/**
 * @dev See {IGovernor-getVotesWithParams}.
 */
function getVotesWithParams(
    address account,
    uint256 timepoint,
    bytes memory params
) public view virtual override returns (uint256) {
    return _getVotes(account, timepoint, params);
}

/**
 * @dev See {IGovernor-castVote}.
 */
function castVote(uint256 proposalId, uint8 support) public virtual override returns (uint256) {
    address voter = _msgSender();
    return _castVote(proposalId, voter, support, "");
}

/**
 * @dev See {IGovernor-castVoteWithReason}.
 */
function castVoteWithReason(
    uint256 proposalId,
    uint8 support,
    string calldata reason
) public virtual override returns (uint256) {
    address voter = _msgSender();
    return _castVote(proposalId, voter, support, reason);
}

/**
 * @dev See {IGovernor-castVoteWithReasonAndParams}.
 */
function castVoteWithReasonAndParams(
    uint256 proposalId,
    uint8 support,
    string calldata reason,
    bytes memory params
) public virtual override returns (uint256) {
    address voter = _msgSender();
    return _castVote(proposalId, voter, support, reason, params);
}

/**
 * @dev See {IGovernor-castVoteBySig}.
 */
function castVoteBySig(
    uint256 proposalId,
    uint8 support,
    uint8 v,
    bytes32 r,
    bytes32 s
) public virtual override returns (uint256) {
    address voter = ECDSA.recover(
        _hashTypedDataV4(keccak256(abi.encode(BALLOT_TYPEHASH, proposalId, support))),
        v,
        r,
        s
    );
    return _castVote(proposalId, voter, support, "");
}

/**
 * @dev See {IGovernor-castVoteWithReasonAndParamsBySig}.
 */
function castVoteWithReasonAndParamsBySig(
    uint256 proposalId,
    uint8 support,
    string calldata reason,
    bytes memory params,
    uint8 v,
    bytes32 r,
    bytes32 s
) public virtual override returns (uint256) {
    address voter = ECDSA.recover(
        _hashTypedDataV4(
            keccak256(
                abi.encode(
                    EXTENDED_BALLOT_TYPEHASH,
                    proposalId,
                    support,
                    keccak256(bytes(reason)),
                    keccak256(params)
                )
            )
        ),
        v,
        r,
        s
    );
    return _castVote(proposalId, voter, support, "");
}


        return _castVote(proposalId, voter, support, reason, params);
    }

 /**
 * @dev Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
 * voting weight using {IGovernor-getVotes} and call the {_countVote} internal function.
 *
 * Emits a {IGovernor-VoteCast} event.
 */
function _castVote(
    uint256 proposalId,
    address account,
    uint8 support,
    string memory reason,
    bytes memory params
) internal virtual returns (uint256) {
    ProposalCore storage proposal = _proposals[proposalId];
    require(state(proposalId) == ProposalState.Active, "Governor: vote not currently active");

    uint256 weight = _getVotes(account, proposal.voteStart, params);
    _countVote(proposalId, account, support, weight, params);

    if (params.length == 0) {
        emit VoteCast(account, proposalId, support, weight, reason);
    } else {
        emit VoteCastWithParams(account, proposalId, support, weight, reason, params);
    }

    return weight;
}

/**
 * @dev Relays a transaction or function call to an arbitrary target. In cases where the governance executor
 * is some contract other than the governor itself, like when using a timelock, this function can be invoked
 * in a governance proposal to recover tokens or Ether that was sent to the governor contract by mistake.
 * Note that if the executor is simply the governor itself, use of `relay` is redundant.
 */
function relay(address target, uint256 value, bytes calldata data) external payable virtual onlyGovernance {
    (bool success, bytes memory returndata) = target.call{value: value}(data);
    require(success, "Governor: relay call failed");
    Address.verifyCallResult(success, returndata, "Governor: relay reverted without message");
}

/**
 * @dev Address through which the governor executes actions. Will be overloaded by modules that execute actions
 * through another contract such as a timelock.
 */
function _executor() internal view virtual returns (address) {
    return address(this);
}

/**
 * @dev See {IERC721Receiver-onERC721Received}.
 */
function onERC721Received(address, address, uint256, bytes memory) public virtual override returns (bytes4) {
    return this.onERC721Received.selector;
}

/**
 * @dev See {IERC1155Receiver-onERC1155Received}.
 */
function onERC1155Received(
    address,
    address,
    uint256,
    uint256,
    bytes memory
) public virtual override returns (bytes4) {
    return this.onERC1155Received.selector;
}

/**
 * @dev See {IERC1155Receiver-onERC1155BatchReceived}.
 */
function onERC1155BatchReceived(
    address,
    address,
    uint256[] memory,
    uint256[] memory,
    bytes memory
) public virtual override returns (bytes4) {
    return this.onERC1155BatchReceived.selector;
}
}
