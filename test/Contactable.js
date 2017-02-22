'use strict';
const assertJump = require('./helpers/assertJump');

var Contactable = artifacts.require('../contracts/ownership/Contactable.sol');

contract('Contactable', function(accounts) {
  let contactable;

  beforeEach(async function() {
    contactable = await Contactable.new();
  });

  it('should have an empty contact info', async function() {
    let info = await contactable.contactInformation();
    assert.isTrue(info == "");
  });

  describe('after setting the contact information', function () {
    let contactInfo = "contact information"

    beforeEach(async function () {
      await contactable.setContactInformation(contactInfo);
    });

    it('should return the setted contact information', async function() {
      let info = await contactable.contactInformation();
      assert.isTrue(info === contactInfo);
   });
  });
});
