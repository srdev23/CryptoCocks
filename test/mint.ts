import { expect } from "chai";
import { ethers, network } from "hardhat";
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
  // eslint-disable-next-line node/no-missing-import
} from "./helper";
import { BigNumber } from "ethers";
// eslint-disable-next-line node/no-missing-import
import { loadPercentileData, PercentileDataEntry } from "./percentiles";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const INIT_MINT_COUNT = 30;

describe("Mint", function () {
  let contracts: Contracts;
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;
  let minters: SignerWithAddress[];
  let percentileData: PercentileDataEntry[];

  beforeEach(async () => {
    [owner, ...minters] = await ethers.getSigners();
    nonOwner = minters[0];
    contracts = await deploy(owner);
    percentileData = await loadPercentileData();
  });

  describe("Private Sale", function () {
    beforeEach(async () => {
      await setContractToPrivateSale(contracts.cryptoCocks, owner);
    });

    it("should not be possible to mint publicly", async () => {
      const minter = minters[0];
      await mintRevert(contracts.cryptoCocks, minter);
    });

    it("should not be possible to execute initial mint by non-owner", async () => {
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
          minters[0],
          maxSupply,
          minBalance,
          10
        );
      });

      it("should not be possible to mint if the maximum supply of a whitelisted token is reached", async () => {
        const signer1 = minters[1];
        const signer2 = minters[2];

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

        await mint(contracts.cryptoCocks, signer1);
        await mintRevert(contracts.cryptoCocks, signer2);

        // tracks the number of minted tokens for TestTokenOne
        const contract = await contracts.cryptoCocks.list(0);
        expect(contract.tracker).to.equal(1);
      });
    });

    it("should be possible to execute initial mint by owner only", async () => {
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
          .withArgs(`${lengths[i - 1]}/${i}/metadata.json`, BigNumber.from(i));
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
          minters[0],
          2,
          minBalanceTokenOne,
          10
        );

        await addWhitelistedContract(
          contracts.cryptoCocks,
          owner,
          contracts.testTokenTwo,
          minters[1],
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
        ] = minters.slice(3, 7);

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
        const signer = minters[2];

        await mintTestToken(
          signer,
          contracts.cryptoCocks,
          contracts.testTokenOne,
          minBalanceTokenOne - 1 // not enough balance of the whitelisted token
        );

        await mintRevert(contracts.cryptoCocks, signer);

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
      await setContractToPublicSale(contracts.cryptoCocks, owner);
    });

    it("should be possible to mint", async () => {
      await mint(contracts.cryptoCocks, minters[0]);
    });

    it("should revert when mint value is less than minimum fee", async () => {
      const mintTx = contracts.cryptoCocks.connect(minters[0]).mint({
        value: ethers.utils.parseEther("0.019"), // 0.02 ether needed
      });

      await expect(mintTx).to.be.revertedWith("INSUFFICIENT_FUNDS");
    });
  });

  describe("Free Sale", function () {
    beforeEach(async () => {
      await setContractToFreeSale(contracts.cryptoCocks, owner);
    });

    it("should be possible to mint", async () => {
      await mint(contracts.cryptoCocks, minters[0]);
      // TODO MF: Assert how much balance was removed from minter's wallet
    });
  });

  describe("Length Calculation", function () {
    it("should calculate lengths correctly for fixed fee", async () => {
      const pTransactions = [...Array(100)].map(async (_, index) => {
        return mint(contracts.cryptoCocks, minters[index]);
      });

      const transactions = await Promise.all(pTransactions);
      for (const tx of transactions) {
        const index = transactions.indexOf(tx);
        const tokenId = index + 1; // starts with 1, not 0
        await expectToken(
          contracts.cryptoCocks,
          tx,
          percentileData[index].length_new,
          tokenId
        );
      }
    }).timeout(0);

    it("should calculate lengths correctly for variable fees", async () => {
      for (let i = 0; i < 100; i++) {
        if (i === 0) {
          // const changeTx = changeFeeSettings(contracts.cryptoCocks, owner, {
          //   percFee: 100,
          // });
          // await changeTx;
          console.log("Changed fee");
        }

        console.log("mint");
        const tx = await mint(contracts.cryptoCocks, minters[i]);

        await expectToken(
          contracts.cryptoCocks,
          await tx,
          percentileData[i].length_new,
          i + 1
        );
      }
    }).timeout(0);
  });

  xit("should calculate lengths correctly for variable fees", async () => {
    const percFee = 100;
    const pTransactions = [...Array(100)].map(async (_, index) => {
      if (index === 0) {
        console.log("change fee");
        // percFee = 90;
        const change = await changeFeeSettings(contracts.cryptoCocks, owner, {
          percFee,
        });
        await change.wait();
      }

      console.log("mint");
      const tx = mint(contracts.cryptoCocks, minters[index], percFee);
      await expectToken(
        contracts.cryptoCocks,
        await tx,
        percentileData[index].length_new,
        index + 1
      );
      await (await tx).wait();
    });

    await Promise.all(pTransactions);
    // for (const tx of transactions) {
    //   const index = transactions.indexOf(tx);
    //   const tokenId = index + 1; // starts with 1, not 0
    //   await expectToken(
    //     contracts.cryptoCocks,
    //     tx,
    //     percentileData[index].length_new,
    //     tokenId
    //   );
    // }
  }).timeout(0);

  xit("should set the token URI correctly", async () => {
    for (let i = 0; i < 100; i++) {
      // const signer = signers[i];
      // const mintTx = mintOld(contracts.cryptoCocks, signer);
      // await expect(mintTx).to.not.be.reverted;

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
    const minter = minters[0];
    await mint(contracts.cryptoCocks, minter);
    await mintRevert(contracts.cryptoCocks, minter, "ONLY_ONE_NFT");
  });

  it("should send the right amount of Ether from the minter's wallet to the contract", async () => {
    const minter = minters[1];
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
    const minter = minters[0];
    const balance = await minter.getBalance();
    const value = await getMintValue(minter);

    const estimation = await contracts.cryptoCocks
      .connect(minter)
      .estimateGas.mint({
        value,
      });

    const tx = contracts.cryptoCocks.connect(minter).mint({
      value: value.sub(estimation).sub(balance.div(1000)),
    });

    await expect(tx).to.be.revertedWith("INSUFFICIENT_FUNDS");
  });
});
