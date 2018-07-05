pragma solidity ^0.4.24;

import "./MintableToken.sol";
import "../../ECRecovery.sol";

/**
 * @title AirdropableToken
 * @author SylTi
 * @dev Simple ERC20 Token that allow for an airdrop to be realised based on signatures from the owner.
 * This allow the owners of the token to forward the gas cost to the receiver of the airdrop instead of having to pay for it.
 */


contract AirdropableToken is MintableToken {
  using ECRecovery for bytes32;

  mapping (address => uint256) public nonces;

  /**
   * @dev Function to mint tokens given a valid signature.
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @param _nonce Unique value used to prevent multiple usage of the same signature 
   * @param _signature Signature of the hash
   * @return A boolean that indicates if the operation was successful.
   */
  function claim(
    address _to,
    uint256 _amount,
    uint256 _nonce,
    bytes _signature
  )
    canMint
    public
    returns (bool)
  {
    require(_nonce == nonces[_to], "Invalid nonce");
    bytes32 proof = getProof(_to, _amount, _nonce);
    address signer = proof.recover(_signature);
    require(signer == owner, "Not signed by owner");
    nonces[_to] = _nonce.add(1);
    return super.doMint(_to, _amount);
  }

  /**
   * @dev Function that create the hash proof used to check against the signature.
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @param _nonce Unique value used to prevent multiple usage of the same signature 
   * @return A bytes32 hash of the parameters.
   */
  function getProof(
    address _to,
    uint256 _amount,
    uint256 _nonce
  ) public view returns (bytes32) 
  {
    return keccak256(
      abi.encodePacked(
        address(this), // check if the signature was for this specific contract
        _to, 
        _amount, 
        _nonce
      )
    ).toEthSignedMessageHash();
  }
}