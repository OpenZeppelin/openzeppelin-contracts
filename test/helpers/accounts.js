/**
 * A helper module to have access to the addresses and private keys of the
 * accounts used by testrpx
 */
export const accounts = [
  {
    'address': '0xdf08f82de32b8d460adbe8d72043e3a7e25a3b39',
    'key': '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501200',
  }, {
    'address': '0x6704fbfcd5ef766b287262fa2281c105d57246a6',
    'key': '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501201',
  }, {
    'address': '0x9e1ef1ec212f5dffb41d35d9e5c14054f26c6560',
    'key': '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501202',
  }, {
    'address': '0xce42bdb34189a93c55de250e011c68faee374dd3',
    'key': '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501203',
  }, {
    'address': '0x97a3fc5ee46852c1cf92a97b7bad42f2622267cc',
    'key': '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501204',
  }, {
    'address': '0xb9dcbf8a52edc0c8dd9983fcc1d97b1f5d975ed7',
    'key': '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501205',
  }, {
    'address': '0x26064a2e2b568d9a6d01b93d039d1da9cf2a58cd',
    'key': '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501206',
  }, {
    'address': '0xe84da28128a48dd5585d1abb1ba67276fdd70776',
    'key': '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501207',
  }, {
    'address': '0xcc036143c68a7a9a41558eae739b428ecde5ef66',
    'key': '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501208',
  }, {
    'address': '0xe2b3204f29ab45d5fd074ff02ade098fbc381d42',
    'key': '0x2bdd21761a483f71054e14f5b827213567971c676928d9a1808cbfa4b7501209',
  },
];

/**
 * Get an array between 1-10 length of accounts used in testrpc.
 */
export function getRandomAccounts (amount) {
  if (amount > 10) throw new Error('Cant require more than 10 random accounts');

  function shuffle (a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  return shuffle(accounts).slice(0, amount);
}
