// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.3.2 (token/ERC721/extensions/draft-ERC721Votes.sol)

pragma solidity ^0.8.0;

import "../ERC721.sol";
import "../../../utils/Voting.sol";
import "../../../utils/Counters.sol";
import "../../../utils/math/Math.sol";
import "../../../utils/Checkpoints.sol";
import "../../../utils/math/SafeCast.sol";
import "../../../utils/cryptography/ECDSA.sol";
import "../../../utils/cryptography/draft-EIP712.sol";

/**
 * @dev Extension of ERC721 to support Compound-like voting and delegation. This version is more generic than Compound's,
 * and supports token supply up to 2^224^ - 1, while COMP is limited to 2^96^ - 1.
 *
 * This extension keeps a history (checkpoints) of each account's vote power. Vote power can be delegated either
 * by calling the {delegate} function directly, or by providing a signature to be used with {delegateBySig}. Voting
 * power can be queried through the public accessors {getVotes} and {getPastVotes}.
 *
 * By default, token balance does not account for voting power. This makes transfers cheaper. The downside is that it
 * requires users to delegate to themselves in order to activate checkpoints and have their voting power tracked.
 * Enabling self-delegation can easily be done by overriding the {delegates} function. Keep in mind however that this
 * will significantly increase the base gas cost of transfers.
 *
 * _Available since v4.5._
 */
abstract contract ERC721Votes is ERC721, EIP712 {
    using Counters for Counters.Counter;
    using Voting for Voting.Votes;

    uint256 _totalVotingPower;
    bytes32 private constant _DELEGATION_TYPEHASH =
        keccak256("Delegation(address delegatee,uint256 nonce,uint256 expiry)");

    Voting.Votes private _votes;
    mapping(address => Counters.Counter) private _nonces;

    /**
     * @dev Initializes the {EIP712} domain separator using the `name` parameter, and setting `version` to `"1"`.
     *
     * It's a good idea to use the same `name` that is defined as the ERC721 token name.
     */
    constructor(string memory name, string memory symbol) ERC721(name, symbol) EIP712(name, "1") {}

    /**
     * @dev Emitted when an account changes their delegate.
     */
    event DelegateChanged(address indexed delegator, address indexed fromDelegate, address indexed toDelegate);

    /**
     * @dev Emitted when a token transfer or delegate change results in changes to an account's voting power.
     */
    event DelegateVotesChanged(address indexed delegate, uint256 previousBalance, uint256 newBalance);

    /**
     * @dev Get number of checkpoints for `account`.
     */
    function numCheckpoints(address account) public view virtual returns (uint32) {
        return SafeCast.toUint32(_votes.getTotalAccountVotes(account));
    }

    /**
     * @dev Get the `pos`-th checkpoint for `account`.
     */
    function checkpointAt(address account, uint32 pos) public view virtual returns (Checkpoints.Checkpoint memory) {
        return _votes.getTotalAccountVotesAt(account, pos);
    }

    /**
     * @dev Get the address `account` is currently delegating to.
     */
    function delegates(address account) public view virtual returns (address) {
        return _votes.delegates(account);
    }

    /**
     * @dev Gets the current votes balance for `account`
     */
    function getVotes(address account) public view returns (uint256) {
        return _votes.getVotes(account);
    }

    /**
     * @dev Retrieve the number of votes for `account` at the end of `blockNumber`.
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastVotes(address account, uint256 blockNumber) public view returns (uint256) {
        return _votes.getVotesAt(account, blockNumber);
    }

    /**
     * @dev Retrieve the `totalVotingPower` at the end of `blockNumber`. Note, this value is the sum of all balances.
     * It is but NOT the sum of all the delegated votes!
     *
     * Requirements:
     *
     * - `blockNumber` must have been already mined
     */
    function getPastVotingPower(uint256 blockNumber) public view returns (uint256) {
        require(blockNumber < block.number, "ERC721Votes: block not yet mined");
        return _votes.getTotalVotesAt(blockNumber);
    }

    /**
     * @dev Delegate votes from the sender to `delegatee`.
     */
    function delegate(address delegatee) public virtual {
        _delegate(_msgSender(), delegatee);
    }

    /**
     * @dev Delegates votes from signer to `delegatee`
     */
    function delegateBySig(
        address delegatee,
        uint256 nonce,
        uint256 expiry,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) public virtual {
        require(block.timestamp <= expiry, "ERC721Votes: signature expired");
        address signer = ECDSA.recover(
            _hashTypedDataV4(keccak256(abi.encode(_DELEGATION_TYPEHASH, delegatee, nonce, expiry))),
            v,
            r,
            s
        );
        require(nonce == _useNonce(signer), "ERC721Votes: invalid nonce");
        _delegate(signer, delegatee);
    }

    /**
     * @dev Maximum token supply. Defaults to `type(uint224).max` (2^224^ - 1).
     */
    function _maxSupply() internal view virtual returns (uint224) {
        return type(uint224).max;
    }

    /**
     * @dev Snapshots the totalSupply after it has been increased.
     */
    function _mint(address account, uint256 tokenId) internal virtual override {
        require(_totalVotingPower + 1 <= _maxSupply(), "ERC721Votes: total supply risks overflowing votes");

        super._mint(account, tokenId);
        _totalVotingPower += 1;

        _votes.mint(account, 1, _hookDelegateVotesChanged);
    }

    /**
     * @dev Snapshots the totalSupply after it has been decreased.
     */
    function _burn(uint256 tokenId) internal virtual override {
        address from = ownerOf(tokenId);
        super._burn(tokenId);
        _totalVotingPower -= 1;
        _votes.burn(from, 1, _hookDelegateVotesChanged);
    }

    /**
     * @dev Move voting power when tokens are transferred.
     *
     * Emits a {DelegateVotesChanged} event.
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._afterTokenTransfer(from, to, tokenId);
        _votes.transfer(from, to, 1, _hookDelegateVotesChanged);
    }

    /**
     * @dev Change delegation for `delegator` to `delegatee`.
     *
     * Emits events {DelegateChanged} and {DelegateVotesChanged}.
     */
    function _delegate(address delegator, address delegatee) internal virtual {
        emit DelegateChanged(delegator, delegates(delegator), delegatee);
        _votes.delegate(delegator, delegatee, balanceOf(delegator), _hookDelegateVotesChanged);
    }

    /**
     * @dev "Consume a nonce": return the current value and increment.
     *
     * _Available since v4.1._
     */
    function _useNonce(address owner) internal virtual returns (uint256 current) {
        Counters.Counter storage nonce = _nonces[owner];
        current = nonce.current();
        nonce.increment();
    }

    /**
     * @dev Returns an address nonce.
     */
    function nonces(address owner) public view virtual returns (uint256) {
        return _nonces[owner].current();
    }

    /**
     * @dev Returns DOMAIN_SEPARATOR.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function _hookDelegateVotesChanged(
        address account,
        uint256 previousBalance,
        uint256 newBalance
    ) private {
        emit DelegateVotesChanged(account, previousBalance, newBalance);
    }
}
