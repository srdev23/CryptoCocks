import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Accounts, Contracts, deploy, getAccounts } from "./deploy";

describe("Settings", function () {
  let contracts: Contracts;
  let accounts: Accounts;

  beforeEach(async () => {
    accounts = getAccounts(await ethers.getSigners());
    contracts = await deploy(accounts);
  });

  it("should initially have no supply", async function () {
    expect(await contracts.cryptoCocks.totalSupply()).to.equal(0);
  });

  it("should be possible to change PublicSalesStatus by owner only", async () => {
    await expect(
      contracts.cryptoCocks
        .connect(accounts.owner)
        .changePublicSaleStatus(false)
    ).to.not.be.reverted;

    await expect(
      contracts.cryptoCocks
        .connect(accounts.nonOwner)
        .changePublicSaleStatus(false)
    ).to.be.reverted;
  });

  it("should be possible to execute changeFeeSettings by owner only", async () => {
    const freeMinting = false;
    const percFee = 80;
    const minFee = ethers.utils.parseEther("0.01");
    await expect(
      contracts.cryptoCocks
        .connect(accounts.owner)
        .changeFeeSettings(freeMinting, percFee, minFee)
    ).to.not.be.reverted;

    await expect(
      contracts.cryptoCocks
        .connect(accounts.nonOwner)
        .changeFeeSettings(freeMinting, percFee, minFee)
    ).to.be.reverted;
  });

  it("should not be possible to have zero percFee without freeMinting", async () => {
    const freeMinting = false;
    const percFee = 0;
    const minFee = ethers.utils.parseEther("0.02");
    await expect(
      contracts.cryptoCocks
        .connect(accounts.owner)
        .changeFeeSettings(freeMinting, percFee, minFee)
    ).to.be.revertedWith("DIVIDE_BY_ZERO");
  });
});
