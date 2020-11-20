const { BN, constants, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { MAX_UINT256, ZERO_ADDRESS } = constants;

const { keccakFromString, bufferToHex } = require('ethereumjs-util');

const ERC20PermitMock = artifacts.require('ERC20PermitMock');

contract('ERC20Permit', function (accounts) {
  const [ initialHolder, spender, recipient, other ] = accounts;

  const name = 'My Token';
  const symbol = 'MTKN';

  const initialSupply = new BN(100);

  beforeEach(async function () {
    this.token = await ERC20PermitMock.new(name, symbol, initialHolder, initialSupply);
  });

  it('initial nonce is 0', async function () {
    expect(await this.token.nonces(spender)).to.be.bignumber.equal('0');
  });

  it('permits', async function () {
    const amount = new BN(42);

    console.log(EIP712DomainSeparator(await this.token.name(), '1', await web3.eth.net.getId(), this.token.address));

    const receipt = await this.token.permit(initialHolder, spender, amount, MAX_UINT256, 0, '0x00000000000000000000000000000000', '0x00000000000000000000000000000000');
  });
});

function EIP712DomainSeparator(name, version, chainID, address) {
  return bufferToHex(keccakFromString(
    bufferToHex(keccakFromString('EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)')) +
    bufferToHex(keccakFromString(name)) +
    bufferToHex(keccakFromString(version)) +
    chainID.toString() +
    address
  ));
}

function ERC2612StructHash(owner, spender, value, nonce, deadline) {
  return bufferToHex(keccakFromString(
    bufferToHex(keccakFromString('Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)')) +
    owner +
    spender +
    value +
    nonce +
    deadline
  ));
}
