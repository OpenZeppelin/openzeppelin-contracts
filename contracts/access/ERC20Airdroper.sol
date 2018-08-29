pragma solidity ^0.4.24;

import "../ECRecovery.sol";
import "../math/SafeMath.sol";
import "../token/ERC20/MintableToken.sol";

/**
 * @title ERC20Airdroper
 * @author SylTi & Shrugs
 * @dev Simple contract that allow for an airdrop to be realised based on signatures from the owner and a MintableToken
 * This allow the owners of the token to forward the gas cost to the receiver of the airdrop instead of having to pay for it.
 */


contract ERC20Airdroper is Ownable {
  using ECRecovery for bytes32;
  using SafeMath for uint256;

  MintableToken token;
  mapping (address => uint256) public nonces;


  constructor(MintableToken _token) public {
    token = _token;
  }

  /**
   * @dev Function to mint tokens given a valid signature.
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @param _nonce Unique value used to prevent multiple usage of the same signature 
   * @param _signature Signature of the hash
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address _to,
    uint256 _amount,
    uint256 _nonce,
    bytes _signature
  )
    public
    returns (bool)
  {
    require(_nonce == nonces[_to], "Invalid nonce");
    bytes32 proof = getProof(_to, _amount, _nonce);
    address signer = proof.recover(_signature);
    require(signer == owner, "Not signed by owner");
    nonces[_to] = _nonce.add(1);
    require(token.mint(_to, _amount), "minting failed");
    return true;
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

  /**
  * @dev Function to stop minting new tokens.
  * @return True if the operation was successful.
  */
  function finishMinting() onlyOwner public returns (bool) {
    require(token.finishMinting(), "finish minting failed");
    return true;
  }
}