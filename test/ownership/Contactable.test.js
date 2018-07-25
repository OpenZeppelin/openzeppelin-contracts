const Contactable = artifacts.require('Contactable');

contract('Contactable', function (accounts) {
  let contactable;

  beforeEach(async function () {
    contactable = await Contactable.new();
  });

  it('should have an empty contact info', async function () {
    const info = await contactable.contactInformation();
    assert.isTrue(info === '');
  });

  describe('after setting the contact information', function () {
    const contactInfo = 'contact information';

    beforeEach(async function () {
      await contactable.setContactInformation(contactInfo);
    });

    it('should return the setted contact information', async function () {
      const info = await contactable.contactInformation();
      assert.isTrue(info === contactInfo);
    });
  });
});
