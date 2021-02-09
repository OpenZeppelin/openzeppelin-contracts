// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./IForwarder.sol";
import "../cryptography/ECDSA.sol";
import "../utils/Counters.sol";

/*
 * @dev Minimal forwarder for GSNv2
 */
contract Forwarder is IForwarder {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    bytes32 private constant _EIP721DOMAIN_TYPEHASH = keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

    mapping(address => Counters.Counter) private _nonces;
    mapping(bytes32 => bool) public _typeHashes;
    mapping(bytes32 => bool) public _domains;

    event RequestTypeRegistered(bytes32 indexed typeHash, string typeStr);
    event DomainRegistered(bytes32 indexed domainSeparator, bytes domainValue);

    constructor(string memory name, string memory version) {
        registerDomainSeparator(name, version);
        registerRequestType("ForwardRequest", "", "");
    }

    function getNonce(address from) public view override returns (uint256) {
        return _nonces[from].current();
    }

    function verify(
        ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes32 requestTypeHash,
        bytes calldata suffixData,
        bytes calldata signature
    )
    public view override
    {
        require(_domains[domainSeparator], "Forwarder: invalid domainSeparator");
        require(_typeHashes[requestTypeHash], "Forwarder: invalid requestTypeHash");
        bytes32 structhash = ECDSA.toTypedDataHash(
            domainSeparator,
            keccak256(abi.encodePacked(
                requestTypeHash,
                abi.encode(
                    req.from,
                    req.to,
                    req.value,
                    req.gas,
                    req.nonce,
                    keccak256(req.data)
                ),
                suffixData
            ))
        );
        require(_nonces[req.from].current() == req.nonce, "Forwarder: invalid nonce");
        require(structhash.recover(signature) == req.from, "Forwarder: invalid signature");
    }

    function execute(
        ForwardRequest calldata req,
        bytes32 domainSeparator,
        bytes32 requestTypeHash,
        bytes calldata suffixData,
        bytes calldata signature
    )
    public payable override returns (bool, bytes memory)
    {
        verify(
            req,
            domainSeparator,
            requestTypeHash,
            suffixData,
            signature
        );
        _nonces[req.from].increment();

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returndata) = req.to.call{gas: req.gas, value: req.value}(abi.encodePacked(req.data, req.from));
        // Check gas: https://ronan.eth.link/blog/ethereum-gas-dangers/
        assert(gasleft() > req.gas / 63);

        return (success, returndata);
    }

    function registerDomainSeparator(
        string memory name,
        string memory version
    )
    public
    {
        bytes memory domainValue = abi.encode(
            _EIP721DOMAIN_TYPEHASH,
            keccak256(bytes(name)),
            keccak256(bytes(version)),
            block.chainid,
            address(this)
        );
        bytes32 domainSeparator = keccak256(domainValue);
        _domains[domainSeparator] = true;
        emit DomainRegistered(domainSeparator, domainValue);
    }

    function registerRequestType(
        string memory typeName,
        string memory extraFields,
        string memory extraTypes
    )
    public
    {
        bytes memory requestType = abi.encodePacked(
            typeName,
            "(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data",
            extraFields,
            ")",
            extraTypes
        );
        bytes32 requestTypehash = keccak256(requestType);
        _typeHashes[requestTypehash] = true;
        emit RequestTypeRegistered(requestTypehash, string(requestType));
    }
}
