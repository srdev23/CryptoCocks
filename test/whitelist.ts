import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import {
  Contracts,
  deploy,
  // eslint-disable-next-line node/no-missing-import
} from "./deploy";
// eslint-disable-next-line node/no-missing-import
import { addWhitelistedContract } from "./helper";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Adding Whitelisted Contracts", function () {
  let contracts: Contracts;
  let owner: SignerWithAddress,
    nonOwner: SignerWithAddress,
    signer1: SignerWithAddress;

  beforeEach(async () => {
    [owner, signer1] = await ethers.getSigners();
    nonOwner = signer1;
    contracts = await deploy(owner);
  });

  it("should be possible to add a whitelisted contract", async () => {
    const percRoyal = 10;
    const maxSupply = 2;
    const minBalance = 100;
    const communityWallet = signer1;
    const testToken = contracts.testTokenOne;

    await addWhitelistedContract(
      contracts.cryptoCocks,
      owner,
      testToken,
      communityWallet,
      maxSupply,
      minBalance,
      percRoyal
    );
  });

  it("should be possible to add a whitelisted contract by owner only", async () => {
    const percRoyal = 10;
    const maxSupply = 2;
    const minBalance = 100;
    const communityWallet = signer1;
    const testToken = contracts.testTokenOne;
    const cc = testToken.address;
    const wallet = communityWallet.address;

    await expect(
      contracts.cryptoCocks
        .connect(nonOwner)
        .addWhiteListing(cc, wallet, maxSupply, minBalance, percRoyal)
    ).to.be.reverted;
  });

  it("should be able to add whitelisted contracts with royalty percentages up to 20% in sum", async () => {
    const percRoyals = [8, 6, 3, 2, 1];
    const communityWallet = signer1;
    const testToken = contracts.testTokenOne;

    for (const percRoyal of percRoyals) {
      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        testToken,
        communityWallet,
        2,
        100,
        percRoyal
      );
    }
  });

  it("should not be able to add whitelisted contracts with royalty percentages more than 20% in sum", async () => {
    const percRoyals = [8, 6, 4, 1, 2]; // 21% (last transaction should fail)
    const communityWallet = signer1;
    const testToken = contracts.testTokenOne;

    for (const percRoyal of percRoyals) {
      // last transaction should fail
      const index = percRoyals.indexOf(percRoyal);
      let expectRevert = false;
      if (index === percRoyals.length - 1) {
        expectRevert = true;
      }

      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        testToken,
        communityWallet,
        2,
        100,
        percRoyal,
        expectRevert
      );
    }
  });

  // it("should be possible to receive balanceOf from external contracts via TokenInterface", async () => {
  //   // accounts.signerTokenOneBelow
  //   const queryTokenOneBelow = contracts.cryptoCocks.queryBalance(
  //     contracts.testTokenOne.address,
  //     accounts.signerTokenOneBelow.address
  //   );
  //   await expect(queryTokenOneBelow).to.not.be.reverted;
  //   expect(await queryTokenOneBelow).to.equal(BigNumber.from(99));
  //
  //   // signerTokenOneAbove1
  //   const queryTokenOneAbove1 = contracts.cryptoCocks.queryBalance(
  //     contracts.testTokenOne.address,
  //     accounts.signerTokenOneAbove1.address
  //   );
  //   await expect(queryTokenOneAbove1).to.not.be.reverted;
  //   expect(await queryTokenOneAbove1).to.equal(BigNumber.from(100));
  //
  //   // signerTokenOneAbove2
  //   const queryTokenOneAbove2 = contracts.cryptoCocks.queryBalance(
  //     contracts.testTokenOne.address,
  //     accounts.signerTokenOneAbove2.address
  //   );
  //   await expect(queryTokenOneAbove2).to.not.be.reverted;
  //   expect(await queryTokenOneAbove2).to.equal(BigNumber.from(150));
  //
  //   // signerTokenOneAbove3
  //   const queryTokenOneAbove3 = contracts.cryptoCocks.queryBalance(
  //     contracts.testTokenOne.address,
  //     accounts.signerTokenOneAbove3.address
  //   );
  //   await expect(queryTokenOneAbove3).to.not.be.reverted;
  //   expect(await queryTokenOneAbove3).to.equal(BigNumber.from(300));
  //
  //   // signerTokenTwoBelow
  //   const queryTokenTwoBelow = contracts.cryptoCocks.queryBalance(
  //     contracts.testTokenTwo.address,
  //     accounts.signerTokenTwoBelow.address
  //   );
  //   await expect(queryTokenTwoBelow).to.not.be.reverted;
  //   expect(await queryTokenTwoBelow).to.equal(BigNumber.from(99));
  //
  //   // signerTokenTwoAbove
  //   const queryTokenTwoAbove = contracts.cryptoCocks.queryBalance(
  //     contracts.testTokenTwo.address,
  //     accounts.signerTokenTwoAbove.address
  //   );
  //   await expect(queryTokenTwoAbove).to.not.be.reverted;
  //   expect(await queryTokenTwoAbove).to.equal(BigNumber.from(100));
  //
  //   // signerTokenBothAbove
  //   const queryTokenBothAbove1 = contracts.cryptoCocks.queryBalance(
  //     contracts.testTokenOne.address,
  //     accounts.signerTokenBothAbove.address
  //   );
  //   await expect(queryTokenBothAbove1).to.not.be.reverted;
  //   expect(await queryTokenBothAbove1).to.equal(BigNumber.from(100));
  //   const queryTokenBothAbove2 = contracts.cryptoCocks.queryBalance(
  //     contracts.testTokenTwo.address,
  //     accounts.signerTokenBothAbove.address
  //   );
  //   await expect(queryTokenBothAbove2).to.not.be.reverted;
  //   expect(await queryTokenBothAbove2).to.equal(BigNumber.from(100));
  // });
});
