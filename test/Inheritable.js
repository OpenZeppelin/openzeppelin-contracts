'use strict'
import { advanceBlock } from './helpers/advanceToBlock'
import increaseTime from './helpers/increaseTime'
import { increaseTimeTo, duration } from './helpers/increaseTime'
import assertJump from './helpers/assertJump'


const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

const Inheritable = artifacts.require('../contracts/ownership/Inheritable.sol')

contract('Inheritable', function(accounts) {
  let inheritable
  let owner

  beforeEach(async function() {
    inheritable = await Inheritable.new()
    owner = await inheritable.owner()
  })

  it('should start off with an owner, but without heir', async function() {
    const heir = await inheritable.heir()

    assert.equal(typeof(owner), 'string')
    assert.equal(typeof(heir), 'string')
    assert.notStrictEqual(
      owner, NULL_ADDRESS,
      "Owner shouldn't be the null address"
      )
    assert.isTrue(
      heir === NULL_ADDRESS,
      "Heir should be the null address"
    )
   })

  it('only owner should set heir', async function() {
    const newHeir = accounts[1]
    const someRandomAddress = accounts[2]
    assert.isTrue(owner !== someRandomAddress)

    await inheritable.setHeir(newHeir, {from: owner})
    try {
      await inheritable.setHeir(newHeir, {from: someRandomAddress})
      assert.fail('should have thrown before')
    } catch(error) {
      assertJump(error)
    }
  })

  it('owner can remove heir', async function() {
    const newHeir = accounts[1]
    await inheritable.setHeir(newHeir, {from: owner})
    let heir = await inheritable.heir()

    assert.notStrictEqual(heir, NULL_ADDRESS)
    await inheritable.removeHeir()
    heir = await inheritable.heir()
    assert.isTrue(heir === NULL_ADDRESS)
  })

  it('owner can set heartbeatTimeout only if they are alive', async function() {
    const newTimeout = 41414141
    await inheritable.setHeartbeatTimeout(newTimeout, {from: owner})

    assert.isTrue((await inheritable.heartbeatTimeout()).equals(new web3.BigNumber(newTimeout)))

    const heir = accounts[1]
    await inheritable.setHeir(heir, {from: owner})
    await inheritable.pronounceDeath({from: heir})

    try {
      await inheritable.setHeartbeatTimeout(newTimeout, {from: owner})
      assert.fail('should have thrown before')
    } catch(error) {
      assertJump(error)
    }
  })

  it('heir can inherit only if owner is dead and timeout was reached', async function() {
    const heir = accounts[1]
    await inheritable.setHeir(heir, {from: owner})
    await inheritable.setHeartbeatTimeout(4141, {from: owner})

    try {
      await inheritable.inherit({from: heir})
      assert.fail('should have thrown before')
    } catch(error) {
      assertJump(error)
    }

    await inheritable.pronounceDeath({from: heir})
    await increaseTime(1)
    try {
      await inheritable.inherit({from: heir})
      assert.fail('should have thrown before')
    } catch(error) {
      assertJump(error)
    }

    await increaseTime(4141)
    await inheritable.inherit({from: heir})

  })

  it('heir can\'t inherit if owner heartbeats', async function() {
    const heir = accounts[1]
    await inheritable.setHeir(heir, {from: owner})
    await inheritable.setHeartbeatTimeout(4141, {from: owner})
      
    await inheritable.pronounceDeath({from: heir})
    await inheritable.heartbeat({from: owner})
    try {
      await inheritable.inherit({from: heir})
      assert.fail('should have thrown before')
    } catch(error) {
      assertJump(error)
    }

    await inheritable.pronounceDeath({from: heir})
    await increaseTime(4141)
    await inheritable.heartbeat({from: owner})
    try {
      await inheritable.inherit({from: heir})
      assert.fail('should have thrown before')
    } catch(error) {
      assertJump(error)
    }
  })

  it('should log events appropriately', async function() {
    const heir = accounts[1]

    const setHeirLogs = (await inheritable.setHeir(heir, {from: owner})).logs
    const setHeirEvent = setHeirLogs.find(e => e.event === 'HeirChanged')

    assert.isTrue(setHeirEvent.args.owner === owner)
    assert.isTrue(setHeirEvent.args.newHeir === heir)

    const heartbeatLogs = (await inheritable.heartbeat({from: owner})).logs
    const heartbeatEvent = heartbeatLogs.find(e => e.event === 'OwnerHeartbeated')

    assert.isTrue(heartbeatEvent.args.owner === owner)

    const pronounceDeathLogs = (await inheritable.pronounceDeath({from: heir})).logs
    const ownerDeadEvent = pronounceDeathLogs.find(e => e.event === 'OwnerPronouncedDead')

    assert.isTrue(ownerDeadEvent.args.owner === owner)
    assert.isTrue(ownerDeadEvent.args.heir === heir)

    const inheritLogs = (await inheritable.inherit({from: heir})).logs
    const ownershipTransferredEvent = inheritLogs.find(e => e.event === 'OwnershipTransferred')

    assert.isTrue(ownershipTransferredEvent.args.previousOwner === owner)
    assert.isTrue(ownershipTransferredEvent.args.newOwner === heir)

  })
})