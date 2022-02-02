import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Contracts, deploy } from "./deploy";
import {
  addWhitelistedContract,
  expectToken,
  getMintValue,
  mint,
  mintTestToken,
  setContractToFreeSale,
  setContractToPrivateSale,
  setContractToPublicSale,
  mintRevert,
  changeFeeSettings,
  getMinter,
  getCID,
  // eslint-disable-next-line node/no-missing-import
} from "./helper";
import { BigNumber } from "ethers";
// eslint-disable-next-line node/no-missing-import
import { loadPercentileData, PercentileDataEntry } from "./percentiles";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// eslint-disable-next-line node/no-missing-import
import { MintEvent } from "../typechain/CryptoCocks";

const INIT_MINT_COUNT = 30;

describe("Mint", function () {
  let contracts: Contracts;
  let owner: SignerWithAddress;
  let signer1: SignerWithAddress,
    signer2: SignerWithAddress,
    signer3: SignerWithAddress,
    signer4: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let minters: SignerWithAddress[];
  let percentileData: PercentileDataEntry[];

  beforeEach(async () => {
    [owner, signer1, signer2, signer3, signer4, ...minters] =
      await ethers.getSigners();
    nonOwner = signer1;
    contracts = await deploy(owner);
    percentileData = await loadPercentileData();
    await setContractToPublicSale(contracts.cryptoCocks, owner);
  });

  describe("Private Sale", function () {
    beforeEach(async () => {
      await setContractToPrivateSale(contracts.cryptoCocks, owner);
    });

    it("should not be possible to mint publicly", async () => {
      await mintRevert(contracts.cryptoCocks, signer1);
    });

    it("should be possible to execute initial mint by owner only", async () => {
      await expect(contracts.cryptoCocks.connect(nonOwner).initMint()).to.be
        .reverted;
    });

    describe("Maximum Supply", function () {
      const minBalance = 10;
      const maxSupply = 1;

      beforeEach(async () => {
        await addWhitelistedContract(
          contracts.cryptoCocks,
          owner,
          contracts.testTokenOne,
          signer1,
          maxSupply,
          minBalance,
          10
        );
      });

      it("should not be possible to mint if the maximum supply of a whitelisted token is reached", async () => {
        await mintTestToken(
          signer2,
          contracts.cryptoCocks,
          contracts.testTokenOne,
          minBalance // enough balance to be permitted to mint
        );
        await mintTestToken(
          signer3,
          contracts.cryptoCocks,
          contracts.testTokenOne,
          minBalance // enough balance to be permitted to mint
        );

        await mint(contracts.cryptoCocks, signer2);
        await mintRevert(contracts.cryptoCocks, signer3);

        // tracks the number of minted tokens for TestTokenOne
        const contract = await contracts.cryptoCocks.list(0);
        expect(contract.tracker).to.equal(1);
      });
    });

    it("should be possible to execute initial mint", async () => {
      const mintTx = await contracts.cryptoCocks.connect(owner).initMint();
      await mintTx.wait();
      const lengths = [
        11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ];
      // expect `PermanentURI` event for newly minted token with correct length
      for (let i = 1; i <= 30; i++) {
        await expect(mintTx)
          .to.emit(contracts.cryptoCocks, "PermanentURI")
          .withArgs(`${lengths[i - 1]}_${i}.json`, BigNumber.from(i));
      }

      expect(await contracts.cryptoCocks.totalSupply()).to.equal(
        INIT_MINT_COUNT
      );
    });

    it("should not to be possible to execute initial mint more than once", async () => {
      // first initial mint should not revert
      await expect(contracts.cryptoCocks.connect(owner).initMint()).to.not.be
        .reverted;
      expect(await contracts.cryptoCocks.totalSupply()).to.equal(30);

      // second initial mit should revert
      await expect(
        contracts.cryptoCocks.connect(owner).initMint()
      ).to.be.revertedWith("ONLY_ONCE");
      expect(await contracts.cryptoCocks.totalSupply()).to.equal(30);
    });

    describe("Balance Amount", function () {
      const minBalanceTokenOne = 100;
      const minBalanceTokenTwo = 50;

      beforeEach(async () => {
        await addWhitelistedContract(
          contracts.cryptoCocks,
          owner,
          contracts.testTokenOne,
          signer1,
          2,
          minBalanceTokenOne,
          10
        );

        await addWhitelistedContract(
          contracts.cryptoCocks,
          owner,
          contracts.testTokenTwo,
          signer2,
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
        ] = [signer1, signer2, signer3, signer4];

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
          await mint(contracts.cryptoCocks, signer);
        }

        // tracks the number of minted tokens for TestTokenOne
        const contract1 = await contracts.cryptoCocks.list(0);
        expect(contract1.tracker).to.equal(2);

        // tracks the number of minted tokens for TestTokenTwo
        const contract2 = await contracts.cryptoCocks.list(1);
        expect(contract2.tracker).to.equal(2);
      });

      it("should not be possible to mint for holder without enough balance of a whitelisted token", async () => {
        await mintTestToken(
          signer3,
          contracts.cryptoCocks,
          contracts.testTokenOne,
          minBalanceTokenOne - 1 // not enough balance of the whitelisted token
        );

        await mintRevert(contracts.cryptoCocks, signer3);

        // tracks the number of minted tokens for TestTokenOne
        const contract1 = await contracts.cryptoCocks.list(0);
        expect(contract1.tracker).to.equal(0);
      });
    });
  });

  describe("Public Sale", function () {
    beforeEach(async () => {
      await setContractToPublicSale(contracts.cryptoCocks, owner);
    });

    it("should be possible to mint", async () => {
      await mint(contracts.cryptoCocks, signer1);
    });

    it("should revert when mint value is less than minimum fee", async () => {
      const mintTx = contracts.cryptoCocks.connect(signer1).mint({
        value: ethers.utils.parseEther("0.019"), // 0.02 ether needed
      });

      await expect(mintTx).to.be.revertedWith("INSUFFICIENT_FUNDS");
    });
  });

  describe("Free Sale", function () {
    beforeEach(async () => {
      await setContractToFreeSale(contracts.cryptoCocks, owner);
    });

    it("should be possible to mint with zero ether value", async () => {
      await mint(contracts.cryptoCocks, signer1, 0);
    });

    it("should not remove ether from the minter's wallet", async () => {
      const minter = signer1;
      const tx = mint(contracts.cryptoCocks, minter, 0);

      await expect(() => tx).to.changeEtherBalances(
        [minter, contracts.cryptoCocks],
        [0, 0]
      );
      await expect(tx).to.not.be.reverted;
    });
  });

  describe("Length Calculation", function () {
    it("should calculate lengths correctly for fixed fee", async () => {
      for (let i = 0; i < 100; i++) {
        const minter = await getMinter(minters, 0, i, percentileData);
        const balance = await minter.getBalance();
        const tx = await mint(contracts.cryptoCocks, minter);

        await expectToken(
          contracts.cryptoCocks,
          await tx,
          percentileData[i].length,
          i + 1,
          INIT_MINT_COUNT
        );

        await expect(tx)
          .to.emit(contracts.cryptoCocks, "Mint")
          .withArgs(i + 30 + 1, balance);
      }
    }).timeout(0);

    it("should calculate lengths correctly for variable fee", async () => {
      let percFee = 50;
      for (let i = 0; i < 100; i++) {
        if (i % 20 === 0) {
          percFee += 10;
          await changeFeeSettings(contracts.cryptoCocks, owner, {
            percFee,
          });
        }

        const minter = await getMinter(minters, 1, i, percentileData);
        const balance = await minter.getBalance();
        const tx = await mint(contracts.cryptoCocks, minter, percFee);

        await expectToken(
          contracts.cryptoCocks,
          await tx,
          percentileData[i].length,
          i + 1,
          INIT_MINT_COUNT
        );

        const receipt = await tx.wait();
        const mintEvent: MintEvent = receipt.events!.filter((x) => {
          return x.event === "Mint";
        })[0] as MintEvent;

        expect(mintEvent.args.balance).to.be.closeTo(balance, 100);
      }
    }).timeout(0);

    it("should set the token URI correctly", async () => {
      for (let i = 0; i < 100; i++) {
        const minter = await getMinter(minters, 2, i, percentileData);
        await mint(contracts.cryptoCocks, minter);

        const tokenId = i + 30 + 1;
        const tokenUri = await contracts.cryptoCocks.tokenURI(tokenId);
        expect(tokenUri).to.equal(
          `ipfs://${getCID(tokenId)}/${
            percentileData[tokenId - 1 - 30].length
          }_${tokenId}.json`
        );
      }
    }).timeout(0);

    it("should calculate lengths correctly for a late initMint", async () => {
      for (let i = 0; i < 100; i++) {
        const minter = await getMinter(minters, 3, i, percentileData);
        await mint(contracts.cryptoCocks, minter);
      }

      const mintTx = await contracts.cryptoCocks.connect(owner).initMint();
      await mintTx.wait();
      const lengths = [
        11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ];
      // expect `PermanentURI` event for newly minted token with correct length
      for (let i = 1; i <= 30; i++) {
        await expect(mintTx)
          .to.emit(contracts.cryptoCocks, "PermanentURI")
          .withArgs(`${lengths[i - 1]}_${i}.json`, BigNumber.from(i));
      }

      expect(await contracts.cryptoCocks.totalSupply()).to.equal(
        INIT_MINT_COUNT + 100
      );
    }).timeout(0);

    it("should start with 31 after initMint", async () => {
      const mintTx = await contracts.cryptoCocks.connect(owner).initMint();
      await mintTx.wait();
      const lengths = [
        11, 11, 11, 11, 11, 11, 11, 11, 11, 11, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ];
      // expect `PermanentURI` event for newly minted token with correct length
      for (let i = 1; i <= 30; i++) {
        await expect(mintTx)
          .to.emit(contracts.cryptoCocks, "PermanentURI")
          .withArgs(`${lengths[i - 1]}_${i}.json`, BigNumber.from(i));
      }

      expect(await contracts.cryptoCocks.totalSupply()).to.equal(
        INIT_MINT_COUNT
      );

      const numberTokens = 100;

      for (let i = 0; i < numberTokens; i++) {
        const minter = await getMinter(minters, 5, i, percentileData);
        const tx = mint(contracts.cryptoCocks, minter);
        const tokenId = i + 31;
        await expect(tx)
          .to.emit(contracts.cryptoCocks, "PermanentURI")
          .withArgs(
            `${percentileData[i].length}_${tokenId}.json`,
            BigNumber.from(tokenId)
          );
      }

      expect(await contracts.cryptoCocks.totalSupply()).to.equal(
        INIT_MINT_COUNT + numberTokens
      );
    }).timeout(0);
  });

  it("should not be possible to mint more than one token", async () => {
    const minter = signer1;
    await mint(contracts.cryptoCocks, minter);
    await mintRevert(contracts.cryptoCocks, minter, "ONLY_ONE_NFT");
  });

  it("should send the right amount of ether from the minter's wallet to the contract", async () => {
    const minter = signer1;
    const value = await getMintValue(minter);

    const tx = contracts.cryptoCocks.connect(minter).mint({
      value,
    });

    // remove value from minter's wallet,
    // add value to contract
    await expect(() => tx).to.changeEtherBalances(
      [minter, contracts.cryptoCocks],
      [value.mul(-1), value]
    );
    await expect(tx).to.not.be.reverted;
  });

  it("should not be possible to send a value less than required", async () => {
    const minter = signer1;
    const balance = await minter.getBalance();
    const value = await getMintValue(minter);

    const tx = contracts.cryptoCocks.connect(minter).mint({
      value: value.sub(balance.div(1000)),
    });

    await expect(tx).to.be.revertedWith("INSUFFICIENT_FUNDS");
  });
});
