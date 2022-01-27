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

/*
███████╗███████╗████████╗██╗   ██╗██████╗
██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗
███████╗█████╗     ██║   ██║   ██║██████╔╝
╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝
███████║███████╗   ██║   ╚██████╔╝██║
╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝
*/

describe("Whitelist", function () {
  let contracts: Contracts;
  let owner: SignerWithAddress,
    nonOwner: SignerWithAddress,
    signer1: SignerWithAddress,
    signer2: SignerWithAddress,
    signer3: SignerWithAddress,
    signer4: SignerWithAddress;
  // let percentileData: PercentileDataEntry[];

  beforeEach(async () => {
    [owner, signer1, signer2, signer3, signer4] = await ethers.getSigners();
    nonOwner = signer1;
    contracts = await deploy(owner);
    // percentileData = await loadPercentileData();
    // await mintTestContractTokens(contracts, accounts, percentileData);
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

    const whiteListed = await contracts.cryptoCocks.list(0);

    expect(whiteListed.percRoyal).to.equal(percRoyal);
    expect(whiteListed.maxSupply).to.equal(maxSupply);
    expect(whiteListed.minBalance).to.equal(minBalance);
    expect(whiteListed.tracker).to.equal(0);
    expect(whiteListed.balance.toNumber()).to.equal(0);
    expect(whiteListed.cc).to.equal(testToken.address);
    expect(whiteListed.wallet).to.equal(communityWallet.address);
  });
  //
  // it("should be possible to add a whitelisted contract by owner only", async () => {
  //   const cc = contracts.testTokenOne.address;
  //   const wallet = accounts.communityWallet1.address;
  //   const maxSupply = 2;
  //   const minBalance = 100;
  //   const percRoyal = 10;
  //
  //   await expect(
  //     contracts.cryptoCocks
  //       .connect(accounts.owner)
  //       .addWhiteListing(cc, wallet, maxSupply, minBalance, percRoyal)
  //   ).to.not.be.reverted;
  //
  //   const whiteListed = await contracts.cryptoCocks.list(0);
  //
  //   expect(whiteListed.percRoyal).to.equal(percRoyal);
  //   expect(whiteListed.maxSupply).to.equal(maxSupply);
  //   expect(whiteListed.minBalance).to.equal(minBalance);
  //   expect(whiteListed.tracker).to.equal(0);
  //   expect(whiteListed.balance.toNumber()).to.equal(0);
  //   expect(whiteListed.cc).to.equal(cc);
  //   expect(whiteListed.wallet).to.equal(wallet);
  //
  //   await expect(
  //     contracts.cryptoCocks
  //       .connect(accounts.nonOwner)
  //       .addWhiteListing(cc, wallet, maxSupply, minBalance, percRoyal)
  //   ).to.be.reverted;
  //
  //   // Check if numContracts was increased
  //   const settings = await contracts.cryptoCocks.set();
  //   expect(settings.numContracts).to.equal(1);
  // });
  //
  // it("should be possible to add a white listing contracts up to total 20% royalty fee", async () => {
  //   // Add additional 10% fee contract with contracts.testTokenTwo
  //   const cc = contracts.testTokenTwo.address;
  //   const wallet = accounts.communityWallet2.address;
  //   const maxSupply = 2;
  //   const minBalance = 100;
  //   const percRoyal = 10;
  //   await expect(
  //     contracts.cryptoCocks
  //       .connect(accounts.owner)
  //       .addWhiteListing(cc, wallet, maxSupply, minBalance, percRoyal)
  //   ).to.be.not.reverted;
  //
  //   const whiteListed = await contracts.cryptoCocks.list(1);
  //
  //   expect(whiteListed.percRoyal).to.equal(percRoyal);
  //   expect(whiteListed.maxSupply).to.equal(maxSupply);
  //   expect(whiteListed.minBalance).to.equal(minBalance);
  //   expect(whiteListed.tracker).to.equal(0);
  //   expect(whiteListed.balance.toNumber()).to.equal(0);
  //   expect(whiteListed.cc).to.equal(cc);
  //   expect(whiteListed.wallet).to.equal(wallet);
  //
  //   // Check if numContracts was increased
  //   const settings = await contracts.cryptoCocks.set();
  //   expect(settings.numContracts).to.equal(2);
  // });
  //
  // it("should not be possible to add a white listing contract with more than 20% royalty fee", async () => {
  //   const cc = contracts.testTokenOne.address;
  //   const wallet = accounts.communityWallet1.address;
  //   const supply = 10;
  //   const balance = 100;
  //   const royalty = 1;
  //
  //   await expect(
  //     contracts.cryptoCocks
  //       .connect(accounts.owner)
  //       .addWhiteListing(cc, wallet, supply, balance, royalty)
  //   ).to.be.revertedWith("FEE_TOO_HIGH");
  // });
  //
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
