import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Accounts, Contracts, deploy, getAccounts } from "./deploy";
import {
  addWhitelistedContract,
  expectToken,
  mint,
  mintAndAssert,
  mintTestToken,
  setContractToFreeSale,
  setContractToPrivateSale,
  setContractToPublicSale,
  // eslint-disable-next-line node/no-missing-import
} from "./helper";
import { BigNumber } from "ethers";
// eslint-disable-next-line node/no-missing-import
import { loadPercentileData, PercentileDataEntry } from "./percentiles";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const INIT_MINT_COUNT = 30;

describe("Mint", function () {
  let contracts: Contracts;
  let signers: SignerWithAddress[];
  let accounts: Accounts;
  let percentileData: PercentileDataEntry[];

  beforeEach(async () => {
    signers = await ethers.getSigners();
    accounts = getAccounts(signers);
    contracts = await deploy(accounts);
    percentileData = await loadPercentileData();
  });

  describe("Private Sale", function () {
    beforeEach(async () => {
      await setContractToPrivateSale(contracts.cryptoCocks, accounts.owner);
    });

    it("should not be possible to mint publicly", async () => {
      const signer = signers[0];
      const mintTx = mint(contracts.cryptoCocks, signer);
      await expect(mintTx).to.be.revertedWith("LOCK");
    });

    it("should not be possible to execute initial mint by non-owner", async () => {
      await expect(contracts.cryptoCocks.connect(accounts.nonOwner).initMint())
        .to.be.reverted;
    });

    describe("Maximum Supply", function () {
      const minBalance = 10;
      const maxSupply = 1;

      beforeEach(async () => {
        await addWhitelistedContract(
          contracts.cryptoCocks,
          accounts.owner,
          contracts.testTokenOne,
          accounts.communityWallet1,
          maxSupply,
          minBalance,
          10
        );
      });

      it("should not be possible to mint if the maximum supply of a whitelisted token is reached", async () => {
        const signer1 = signers[0];
        const signer2 = signers[1];

        await mintTestToken(
          signer1,
          contracts.cryptoCocks,
          contracts.testTokenOne,
          minBalance // enough balance to be permitted to mint
        );
        await mintTestToken(
          signer2,
          contracts.cryptoCocks,
          contracts.testTokenOne,
          minBalance // enough balance to be permitted to mint
        );

        await expect(mint(contracts.cryptoCocks, signer1)).to.not.be.reverted;
        await expect(mint(contracts.cryptoCocks, signer2)).to.be.revertedWith(
          "LOCK"
        );

        // tracks the number of minted tokens for TestTokenOne
        const contract = await contracts.cryptoCocks.list(0);
        expect(contract.tracker).to.equal(1);
      });
    });

    it("should be possible to execute initial mint by owner only", async () => {
      const mintTx = await contracts.cryptoCocks
        .connect(accounts.owner)
        .initMint();
      await mintTx.wait();
      const lengths = [
        11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ];
      // expect `PermanentURI` event for newly minted token with correct length
      for (let i = 1; i <= 30; i++) {
        await expect(mintTx)
          .to.emit(contracts.cryptoCocks, "PermanentURI")
          .withArgs(`${lengths[i - 1]}/${i}/metadata.json`, BigNumber.from(i));
      }

      expect(await contracts.cryptoCocks.totalSupply()).to.equal(
        INIT_MINT_COUNT
      );
    });

    it("should not to be possible to execute initial mint more than once", async () => {
      // first initial mint should not revert
      await expect(contracts.cryptoCocks.connect(accounts.owner).initMint()).to
        .not.be.reverted;
      expect(await contracts.cryptoCocks.totalSupply()).to.equal(30);

      // second initial mit should revert
      await expect(
        contracts.cryptoCocks.connect(accounts.owner).initMint()
      ).to.be.revertedWith("ONLY_ONCE");
      expect(await contracts.cryptoCocks.totalSupply()).to.equal(30);
    });

    describe("Balance Amount", function () {
      const minBalanceTokenOne = 100;
      const minBalanceTokenTwo = 50;

      beforeEach(async () => {
        await addWhitelistedContract(
          contracts.cryptoCocks,
          accounts.owner,
          contracts.testTokenOne,
          accounts.communityWallet1,
          2,
          minBalanceTokenOne,
          10
        );

        await addWhitelistedContract(
          contracts.cryptoCocks,
          accounts.owner,
          contracts.testTokenTwo,
          accounts.communityWallet2,
          2,
          minBalanceTokenTwo,
          10
        );
      });

      it("should be possible to mint for holders with enough balance of a whitelisted token", async () => {
        const [
          signerTokenOne,
          otherSignerTokenOne,
          signerTokenTwo,
          signerTokenBoth,
        ] = signers.slice(1, 5);

        await mintTestToken(
          signerTokenOne,
          contracts.cryptoCocks,
          contracts.testTokenOne,
          minBalanceTokenOne
        );

        await mintTestToken(
          otherSignerTokenOne,
          contracts.cryptoCocks,
          contracts.testTokenOne,
          minBalanceTokenOne
        );

        await mintTestToken(
          signerTokenTwo,
          contracts.cryptoCocks,
          contracts.testTokenTwo,
          minBalanceTokenTwo
        );

        await mintTestToken(
          signerTokenBoth,
          contracts.cryptoCocks,
          contracts.testTokenOne,
          minBalanceTokenOne
        );

        await mintTestToken(
          signerTokenBoth,
          contracts.cryptoCocks,
          contracts.testTokenTwo,
          minBalanceTokenTwo
        );

        for (const signer of [
          signerTokenOne,
          otherSignerTokenOne,
          signerTokenTwo,
          signerTokenBoth,
        ]) {
          await mintAndAssert(contracts.cryptoCocks, signer);
        }

        // tracks the number of minted tokens for TestTokenOne
        const contract1 = await contracts.cryptoCocks.list(0);
        expect(contract1.tracker).to.equal(2);

        // tracks the number of minted tokens for TestTokenTwo
        const contract2 = await contracts.cryptoCocks.list(1);
        expect(contract2.tracker).to.equal(2);
      });

      it("should not be possible to mint for holder without enough balance of a whitelisted token", async () => {
        const signer = signers[0];

        await mintTestToken(
          signer,
          contracts.cryptoCocks,
          contracts.testTokenOne,
          minBalanceTokenOne - 1 // not enough balance of the whitelisted token
        );

        await expect(mint(contracts.cryptoCocks, signer)).to.be.revertedWith(
          "LOCK"
        );

        // tracks the number of minted tokens for TestTokenOne
        const contract1 = await contracts.cryptoCocks.list(0);
        expect(contract1.tracker).to.equal(0);
      });

      xit("should set the whitelisted contract balance correctly", async () => {
        // expect(contract.balance).to.equal(feesWhiteListed);
      });
    });
  });

  describe("Public Sale", function () {
    beforeEach(async () => {
      await setContractToPublicSale(contracts.cryptoCocks, accounts.owner);
    });

    it("should be possible to mint", async () => {
      await mintAndAssert(contracts.cryptoCocks, signers[0]);
    });

    it("should revert when mint value is less than minimum fee", async () => {
      const mintTx = contracts.cryptoCocks.connect(signers[0]).mint({
        value: ethers.utils.parseEther("0.019"), // 0.02 ether needed
      });

      await expect(mintTx).to.be.revertedWith("INSUFFICIENT_FUNDS");
    });
  });

  describe("Free Sale", function () {
    beforeEach(async () => {
      await setContractToFreeSale(contracts.cryptoCocks, accounts.owner);
    });

    it("should be possible to mint", async () => {
      await mintAndAssert(contracts.cryptoCocks, signers[0]);
      // TODO MF: Assert how much balance was removed from minter's wallet
    });
  });

  xit("should calculate lengths correctly", async () => {
    for (let i = 0; i < 100; i++) {
      // mint token
      const signer = signers[i];
      const mintTx = await mintAndAssert(contracts.cryptoCocks, signer);
      // const mintTx = mint(contracts.cryptoCocks, signer);
      // await expect(mintTx).to.not.be.reverted;

      // expect `PermanentURI` event for newly minted token with correct length
      const tokenId = i + 1; // starts with 1, not 0
      expectToken(
        contracts.cryptoCocks,
        mintTx,
        percentileData[i].length_new,
        tokenId
      );
    }
  }).timeout(0);

  xit("should set the token URI correctly", async () => {
    for (let i = 0; i < 100; i++) {
      const signer = signers[i];
      const mintTx = mint(contracts.cryptoCocks, signer);
      await expect(mintTx).to.not.be.reverted;

      const tokenId = i + 1;
      const tokenUri = await contracts.cryptoCocks.tokenURI(tokenId);
      expect(tokenUri).to.equal(
        `ifps://bafybeicftqysvuqz2aa4ivf3af3usqwt435h6iae7nhompakqy2uh5drye/${
          percentileData[tokenId - 1].length_new
        }/${tokenId}/metadata.json`
      );
    }
  });

  it("should not be possible to mint more than one token", async () => {
    const minter = signers[0];
    await mintAndAssert(contracts.cryptoCocks, minter);
    await expect(mint(contracts.cryptoCocks, minter)).to.be.revertedWith(
      "ONLY_ONE_NFT"
    );
  });
});
