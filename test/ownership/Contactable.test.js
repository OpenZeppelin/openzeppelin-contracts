const Contactable = artifacts.require('Contactable');

contract('Contactable', function () {
  let contactable;

  beforeEach(async function () {
    contactable = await Contactable.new();
  });

  it('should have an empty contact info', async function () {
    (await contactable.contactInformation()).should.eq('');
  });

  describe('after setting the contact information', function () {
    const contactInfo = 'contact information';

    beforeEach(async function () {
      await contactable.setContactInformation(contactInfo);
    });

    it('should return the setted contact information', async function () {
      (await contactable.contactInformation()).should.eq(contactInfo);
    });
  });
});
