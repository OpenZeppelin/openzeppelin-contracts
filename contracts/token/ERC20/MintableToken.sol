pragma solidity ^0.4.24;

import "./StandardToken.sol";
import "../../ownership/Ownable.sol";
import "../../ECRecovery.sol";


/**
 * @title Mintable token
 * @dev Simple ERC20 Token example, with mintable token creation
 * Based on code by TokenMarketNet: https://github.com/TokenMarketNet/ico/blob/master/contracts/MintableToken.sol
 */
contract MintableToken is StandardToken, Ownable {
  using ECRecovery for bytes32;

  event Mint(address indexed to, uint256 amount);
  event MintFinished();

  bool public mintingFinished = false;
  mapping (bytes => bool) usedSignatures;

  modifier canMint() {
    require(!mintingFinished);
    _;
  }

  modifier hasMintPermission() {
    require(msg.sender == owner);
    _;
  }

  /**
   * @dev Function to mint tokens from approved address
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function mint(
    address _to,
    uint256 _amount
  )
    hasMintPermission
    canMint
    public
    returns (bool)
  {
    return doMint(_to, _amount);
  }

  /**
   * @dev Function to mint tokens from an off chain signed message. This can be very usefull during airdrop to make the redeemer pay the gas instead of the owner of the contract.
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @param _nonce Unique value used to allow multiple minting of the same amount to the same address 
   * @param _amount Signature of the hash
   * @return A boolean that indicates if the operation was successful.
   */
  function mintWithSignature(
    address _to,
    uint256 _amount,
    uint256 _nonce,
    bytes _signature
  )
    canMint
    public
    returns (bool)
  {
    require(usedSignatures[_signature] == false, "Signature already used");
    bytes32 proof = keccak256(
      address(this), 
      _to, 
      _amount, 
      _nonce
      ).toEthSignedMessageHash();
    address signer = proof.recover(_signature);
    require(signer == owner, "Not signed by owner");
    usedSignatures[_signature] = true;
    return doMint(_to, _amount);
  }
  
  /**
   * @dev Function to stop minting new tokens.
   * @return True if the operation was successful.
   */
  function finishMinting() onlyOwner canMint public returns (bool) {
    mintingFinished = true;
    emit MintFinished();
    return true;
  }

  /**
   * @dev Private function that do the actual minting of tokens
   * @param _to The address that will receive the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function doMint(
    address _to,
    uint256 _amount
  )
    private
    returns (bool)
  {
    totalSupply_ = totalSupply_.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    emit Mint(_to, _amount);
    emit Transfer(address(0), _to, _amount);
    return true;
  }

}
