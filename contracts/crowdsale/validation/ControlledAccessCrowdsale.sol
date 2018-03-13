pragma solidity ^0.4.18;

import "../Crowdsale.sol";
import "../../ownership/Ownable.sol";


/**
 * @title ControlledAccess
 * @dev The ControlledAccess contract allows functions to be restricted to users
 * that possess a signed authorization from the owner of the contract. This signed
 * message includes the address to give permission to and the contract address.
 * Both addresses are required to prevent reusing the same authorization message
 * on different contract with same owner.
 */
contract ControlledAccessCrowdsale is Crowdsale, Ownable {

    /**
     * @dev Requires msg.sender to have valid access message.
     * @param _sig Valid signature from owner 
     */
    modifier onlyValidAccess(bytes _sig)
    {
      require( isValidAccessMessage(msg.sender, _sig) );
      _;
    }

    /**
     * @dev Verifies if message was signed by owner to give access to _add for this contract.
     *      Assumes Geth signature prefix.
     * @param _add Address of agent with access.
     * @param _sig Valid signature from owner 
     * @return Validity of access message for a given address.
     */
    function isValidAccessMessage(address _add, bytes _sig)
        view public returns (bool)
    {
      bytes32 r;
      bytes32 s;
      uint8 v;

      //Extract ECDSA signature variables from `sig`
      assembly {
        r := mload(add(_sig, 32))
        s := mload(add(_sig, 64))
        v := byte(0, mload(add(_sig, 96)))
      }

      // Version of signature should be 27 or 28, but 0 and 1 are also possible versions
      if (v < 27) {
        v += 27;
      }

      // Verifying if recovered signer is contract owner
      bytes32 hash = keccak256(this, _add);
      return owner == ecrecover(
          keccak256("\x19Ethereum Signed Message:\n32", hash),
          v,
          r,
          s
      );
    }

    /**
     * @dev low level token purchase ***DO NOT OVERRIDE***
     * @param _beneficiary Address performing the token purchase
     * @param _sig Access message to provide with purchase.
     */
    function buyTokens(address _beneficiary, bytes _sig) public payable {

      uint256 weiAmount = msg.value;
      _preValidatePurchase(_beneficiary, weiAmount, _sig);

      // calculate token amount to be created
      uint256 tokens = _getTokenAmount(weiAmount);

      // update state
      weiRaised = weiRaised.add(weiAmount);

      _processPurchase(_beneficiary, tokens);
      TokenPurchase(msg.sender, _beneficiary, weiAmount, tokens);

      _updatePurchasingState(_beneficiary, weiAmount);

      _forwardFunds();
      _postValidatePurchase(_beneficiary, weiAmount);
    }

    /**
     * @dev Extend parent behavior requiring beneficiary to have valid access message
     * @param _beneficiary Token beneficiary.
     * @param _weiAmount Amount of wei contributed.
     * @param _sig Valid signature from owner 
     */
    function _preValidatePurchase(
             address _beneficiary, 
             uint256 _weiAmount,
             bytes _sig) 
            internal onlyValidAccess(_sig) 
    {
      super._preValidatePurchase(_beneficiary, _weiAmount);
    }

    /**
     * @dev fallback function where the msg.data is the signature
     * 
     */
    function () external payable {
      buyTokens(msg.sender, msg.data);
    }
}
