pragma solidity ^0.6.0;

import "./ERC20.sol";
import "./IERC2612Permit.sol";
import "../../cryptography/ECDSA.sol";

abstract contract ERC20Permit is ERC20, IERC2612Permit {
    mapping (address => uint256) private _nonces;

    bytes32 private immutable _PERMIT_TYPEHASH = keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)");
    string private constant _VERSION = "1";

    bytes32 public DOMAIN_SEPARATOR;

    constructor() internal {
        updateDomainSeparator();
    }

    function updateDomainSeparator() public {
        uint256 chainID;
        assembly {
            chainID := chainid()
        }

        DOMAIN_SEPARATOR = keccak256(
            abi.encodePacked(
                keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
                keccak256(bytes(name())),
                keccak256(bytes(_VERSION)),
                chainID,
                address(this)
            )
        );
    }

    function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) public override {
        require(block.timestamp <= deadline, "ERC20Permit: expired deadline");

        bytes32 hash = keccak256(
            abi.encodePacked(
                "\x19\x01",
                DOMAIN_SEPARATOR,
                keccak256(
                    abi.encodePacked(
                        _PERMIT_TYPEHASH,
                        owner,
                        spender,
                        value,
                        _nonces[owner],
                        deadline
                    )
                )
            )
        );

        address signer = ECDSA.recover(hash, v, r, s);
        require(signer == owner, "ERC20Permit: invalid signature");

        _nonces[owner] += 1;
        _approve(owner, spender, value);
    }
}
