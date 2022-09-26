const { expect } = require('chai');

contract('ERC777', function (accounts) {
    const [alice, bob, carl, ...otherAccounts] = accounts;
    let contract;

    beforeEach(async function () {
        const ERC4907Demo = artifacts.require('ERC4907Demo');
        contract = await ERC4907Demo.new("4907", "4907");
    });

    describe("setUser", function () {
        it("Should set user to bob", async function () {
            await contract.mint(1, alice);
            let expires = Math.floor(new Date().getTime() / 1000) + 1000;
            await contract.setUser(1, bob, BigInt(expires),{ from: alice });
            expect(await contract.userOf(1)).equals(bob);
            expect(await contract.ownerOf(1)).equals(alice);
        });

        it("Should set user to carl", async function () {
            await contract.mint(1, alice);
            let expires = Math.floor(new Date().getTime() / 1000) + 1000;
            await contract.setUser(1, bob, BigInt(expires),{ from: alice });
            await contract.setUser(1, carl, BigInt(expires),{ from: alice });
            expect(await contract.userOf(1)).equals(carl);
            expect(await contract.ownerOf(1)).equals(alice);
        });

    });
});
