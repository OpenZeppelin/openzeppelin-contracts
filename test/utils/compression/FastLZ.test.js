const { ethers } = require('hardhat');
const { expect } = require('chai');
const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers');

const { LibZip } = require('solady/js/solady');

async function fixture() {
  const mock = await ethers.deployContract('$FastLZ');
  return { mock };
}

// From https://github.com/google/snappy/blob/main/snappy_unittest.cc
const unittests = [
  '',
  'a',
  'ab',
  'abc',
  'aaaaaaa' + 'b'.repeat(16) + 'aaaaa' + 'abc',
  'aaaaaaa' + 'b'.repeat(256) + 'aaaaa' + 'abc',
  'aaaaaaa' + 'b'.repeat(2047) + 'aaaaa' + 'abc',
  'aaaaaaa' + 'b'.repeat(65536) + 'aaaaa' + 'abc',
  'abcaaaaaaa' + 'b'.repeat(65536) + 'aaaaa' + 'abc',
  'abcabcabcabcabcabcab',
  'abcabcabcabcabcabcab0123456789ABCDEF',
  'abcabcabcabcabcabcabcabcabcabcabcabc',
  'abcabcabcabcabcabcabcabcabcabcabcabc0123456789ABCDEF',
];

describe('FastLZ', function () {
  before(async function () {
    Object.assign(this, await loadFixture(fixture));
  });

  describe('decompress', function () {
    for (const [i, str] of Object.entries(unittests)) {
      it(`Google's unit tests #${i}: length ${str.length}`, async function () {
        this.input = str;
      });
    }

    it('Lorem ipsum...', async function () {
      this.input =
        '\
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas ligula urna, bibendum sagittis eleifend non, rutrum sit amet lectus. Donec eu pellentesque dolor, varius lobortis erat. In viverra diam in nunc porta, at pretium orci hendrerit. Duis suscipit lacus eu sodales imperdiet. Donec rhoncus tincidunt sem sed laoreet. Suspendisse potenti. Suspendisse a dictum diam, a porttitor augue. Praesent sodales quis nisi sed auctor. Nullam efficitur est eros, a tincidunt velit faucibus consequat. Praesent urna leo, imperdiet ut mi eu, pellentesque mattis ante. Suspendisse cursus lacus ac urna egestas, vitae ultricies ante porttitor. In sed risus vitae nunc faucibus tristique.\
Quisque aliquet bibendum augue, et tristique lorem pellentesque quis. Nulla rhoncus erat sed velit luctus, in cursus neque suscipit. Quisque sit amet mauris nec enim congue sagittis eu nec diam. Quisque a enim a leo aliquam vestibulum a ut risus. In hendrerit cursus nisl, et porttitor dolor volutpat non. Donec rhoncus, nisl ut blandit porta, libero felis vulputate ante, et pharetra ex risus et enim. Vestibulum eu ultricies ipsum, quis auctor odio. Morbi ornare metus nec purus elementum, eu interdum magna dapibus. Aliquam odio ipsum, semper in nisl tristique, fermentum porta risus. Curabitur facilisis felis a molestie dignissim. Pellentesque aliquet sagittis sodales. Fusce at dignissim mi. Nulla a tempus quam.\
Nam et egestas quam. Aliquam bibendum iaculis mauris a sagittis. Suspendisse tincidunt, magna vitae scelerisque pharetra, orci nisi venenatis est, sit amet consequat ligula dolor eu felis. Nulla suscipit eleifend augue, et commodo elit lobortis eget. Integer pharetra commodo metus, at accumsan arcu porttitor sed. Ut eu nulla sit amet diam imperdiet fermentum id in erat. Curabitur at neque ornare neque dictum malesuada a nec enim. Ut ac aliquam mauris, eu pretium urna. Donec vitae leo eros. Phasellus et purus rhoncus, accumsan ligula vel, sagittis lectus. Mauris sed lectus elementum, porta nisl eget, convallis ligula. Aenean pellentesque arcu ac lacus scelerisque sollicitudin. Nunc vitae enim egestas, sollicitudin ipsum vulputate, fringilla urna. Aenean eget libero sollicitudin, sagittis lorem in, convallis nibh.\
Cras cursus luctus malesuada. Sed dictum, sem feugiat placerat placerat, nisl neque blandit enim, quis semper mauris augue quis lacus. Interdum et malesuada fames ac ante ipsum primis in faucibus. Pellentesque dignissim quis est et auctor. Etiam porttitor facilisis nibh eget luctus. Etiam at congue neque. Donec a odio varius, rhoncus metus ac, bibendum est. Nullam nisl tortor, egestas id quam sed, hendrerit lobortis diam. Phasellus eros sapien, hendrerit nec ex nec, convallis ullamcorper nibh. Integer tempor hendrerit auctor. Duis ut orci iaculis, tincidunt dui eget, faucibus magna. Pellentesque sit amet eros ac nibh pulvinar volutpat. In ligula felis, hendrerit non congue finibus, tincidunt a nibh. Morbi suscipit dui orci, eget volutpat odio malesuada in.\
Nullam eget pharetra mauris. Cras nec ultricies mi. Suspendisse sit amet ligula lectus. Vestibulum commodo massa nec turpis viverra, nec tempor velit convallis. Etiam egestas quam ut justo rhoncus porta. Morbi viverra mi dui, mattis feugiat neque pulvinar laoreet. Curabitur pulvinar mi vitae nisi sodales tristique. Nunc vulputate maximus ante ac venenatis.\
';
    });

    it('Random buffer', async function () {
      this.input = ethers.randomBytes(4096);
    });

    afterEach(async function () {
      const raw = ethers.isBytesLike(this.input) ? this.input : ethers.toUtf8Bytes(this.input);
      const hex = ethers.hexlify(raw);
      const compressed = LibZip.flzCompress(hex);
      await expect(this.mock.$decompress(compressed)).to.eventually.equal(hex);
      await expect(this.mock.$decompressCalldata(compressed)).to.eventually.equal(hex);
    });
  });
});
