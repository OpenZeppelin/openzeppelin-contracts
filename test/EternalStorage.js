'use strict';

import expectThrow from './helpers/expectThrow';
let EternalStorage = artifacts.require('../contracts/data/EternalStorage.sol');

contract('EternalStorage', function (accounts) {
  let storage;

  beforeEach(async function () {
    storage = await EternalStorage.new();
  });

  contract('UIntValues', function () {
    it('should start with a value of 0', async function () {
      let value = await storage.UIntValues(web3.sha3("value"));

      assert.equal(value, 0);
    });

    it('should set value to 1', async function () {
      await storage.setUIntValue(web3.sha3("value"), 1);
      let value = await storage.UIntValues(web3.sha3("value"));

      assert.equal(value, 1);
    });
    it('should fail to set negative number', async function () {
      await storage.setUIntValue(web3.sha3("value"), -1);
      let value = await storage.UIntValues(web3.sha3("value"));

      assert.notEqual(value.toNumber(), -1);
    })
  });

  contract('IntValues', function () {
    it('should start with a value of 0', async function () {
      let value = await storage.IntValues(web3.sha3("value"));

      assert.equal(value, 0);
    });

    it('should set value to -1', async function () {
      await storage.setIntValue(web3.sha3("value"), -1);
      let value = await storage.IntValues(web3.sha3("value"));

      assert.equal(value, -1);
    });

    it('should fail to set an address', async function () {
      await storage.setIntValue(web3.sha3("value"), accounts[0])
      let value = await storage.UIntValues(web3.sha3("value"));
      assert.notEqual(value.valueOf(), accounts[0]);
    })
  });

  contract('StringValues', function () {
    it('should start with a empty string', async function () {
      let value = await storage.StringValues(web3.sha3("value"));

      assert.equal(value.valueOf(), "");
    });

    it('should set string value to test', async function () {
      await storage.setStringValue(web3.sha3("value"), "test");
      let value = await storage.StringValues(web3.sha3("value"));

      assert.equal(value.valueOf(), "test");
    });
  });

  contract('AddressValues', function () {
    it('should start with a empty Address', async function () {
      let value = await storage.AddressValues(web3.sha3("value"));

      assert.equal(value.valueOf(), 0x0);
    });

    it('should set Address value to accounts[0]', async function () {
      await storage.setAddressValue(web3.sha3("value"), accounts[0]);
      let value = await storage.AddressValues(web3.sha3("value"));

      assert.equal(value.valueOf(), accounts[0]);
    });
  });

  contract('BytesValues', function () {
    it('should start with a empty Bytes', async function () {
      let value = await storage.BytesValues(web3.sha3("value"));

      assert.equal(value.valueOf(), "0x");
    });

    it('should set Bytes value to substring of sha3(test)', async function () {
      let insert = web3.sha3("test").substring(0, 10);
      await storage.setBytesValue(web3.sha3("value"), insert);
      let value = await storage.BytesValues(web3.sha3("value"));

      assert.equal(value.valueOf(), insert);
    });
  });

  contract('Bytes32Values', function () {
    it('should start with a empty Bytes32', async function () {
      let value = await storage.Bytes32Values(web3.sha3("value"));

      assert.equal(value.valueOf(), "0x0000000000000000000000000000000000000000000000000000000000000000");
    });

    it('should set Bytes32 value to sha3(test)', async function () {
      let insert = web3.sha3("test");
      await storage.setBytes32Value(web3.sha3("value"), insert);
      let value = await storage.Bytes32Values(web3.sha3("value"));

      assert.equal(value.valueOf(), insert);
    });
  });

  contract('BooleanValues', function () {
    it('should start with a empty Boolean', async function () {
      let value = await storage.BooleanValues(web3.sha3("value"));

      assert.equal(value, false);
    });

    it('should set Boolean value to true', async function () {
      await storage.setBooleanValue(web3.sha3("value"), true);
      let value = await storage.BooleanValues(web3.sha3("value"));

      assert.equal(value, true);
    });
  });
});
