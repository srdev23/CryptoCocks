import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Contracts, deploy } from "./deploy";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("Settings", function () {
  let contracts: Contracts;
  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  beforeEach(async () => {
    [owner, nonOwner] = await ethers.getSigners();
    contracts = await deploy(owner);
  });

  it("should initially have no supply", async function () {
    expect(await contracts.cryptoCocks.totalSupply()).to.equal(0);
  });

  it("should be possible to change PublicSalesStatus by owner only", async () => {
    await expect(
      contracts.cryptoCocks.connect(owner).changePublicSaleStatus(false)
    ).to.not.be.reverted;

    await expect(
      contracts.cryptoCocks.connect(nonOwner).changePublicSaleStatus(false)
    ).to.be.reverted;
  });

  it("should be possible to execute changeFeeSettings by owner only", async () => {
    const freeMinting = false;
    const percFee = 80;
    const minFee = ethers.utils.parseEther("0.01");
    await expect(
      contracts.cryptoCocks
        .connect(owner)
        .changeFeeSettings(freeMinting, percFee, minFee)
    ).to.not.be.reverted;

    await expect(
      contracts.cryptoCocks
        .connect(nonOwner)
        .changeFeeSettings(freeMinting, percFee, minFee)
    ).to.be.reverted;
  });

  it("should be possible to execute changeWhitelistingSettings by owner only", async () => {
    await expect(
      contracts.cryptoCocks.connect(owner).changeWhitelistingSettings(true)
    ).to.not.be.reverted;

    await expect(
      contracts.cryptoCocks.connect(owner).changeWhitelistingSettings(false)
    ).to.not.be.reverted;

    await expect(
      contracts.cryptoCocks.connect(nonOwner).changeWhitelistingSettings(true)
    ).to.be.reverted;
  });

  it("should not be possible to have zero percFee without freeMinting", async () => {
    const freeMinting = false;
    const percFee = 0;
    const minFee = ethers.utils.parseEther("0.02");
    await expect(
      contracts.cryptoCocks
        .connect(owner)
        .changeFeeSettings(freeMinting, percFee, minFee)
    ).to.be.revertedWith("DIVIDE_BY_ZERO");
  });
});
