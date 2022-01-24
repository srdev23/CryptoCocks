import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
// eslint-disable-next-line node/no-missing-import
import { CryptoCocks } from "../typechain";
// eslint-disable-next-line node/no-missing-import
import { deployContracts } from "./helper";

describe("CryptoCocks Settings", function () {
  let cryptoCocks: CryptoCocks;

  let owner: SignerWithAddress;
  let nonOwner: SignerWithAddress;

  beforeEach(async () => {
    const deployed = await deployContracts();
    owner = deployed.owner;
    nonOwner = deployed.nonOwner;
    cryptoCocks = deployed.cryptoCocks;
  });

  /*
 ████████╗███████╗███████╗████████╗    ███████╗███████╗████████╗████████╗██╗███╗   ██╗ ██████╗ ███████╗
 ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝    ██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██║████╗  ██║██╔════╝ ██╔════╝
    ██║   █████╗  ███████╗   ██║       ███████╗█████╗     ██║      ██║   ██║██╔██╗ ██║██║  ███╗███████╗
    ██║   ██╔══╝  ╚════██║   ██║       ╚════██║██╔══╝     ██║      ██║   ██║██║╚██╗██║██║   ██║╚════██║
    ██║   ███████╗███████║   ██║       ███████║███████╗   ██║      ██║   ██║██║ ╚████║╚██████╔╝███████║
    ╚═╝   ╚══════╝╚══════╝   ╚═╝       ╚══════╝╚══════╝   ╚═╝      ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
  */

  it("should have no supply", async function () {
    expect(await cryptoCocks.totalSupply()).to.equal(0);
  });

  it("should be possible to change PublicSalesStatus by owner only", async () => {
    await expect(cryptoCocks.connect(owner).changePublicSaleStatus(false)).to
      .not.be.reverted;

    await expect(cryptoCocks.connect(nonOwner).changePublicSaleStatus(false)).to
      .be.reverted;
  });

  it("should be possible to execute changeFeeSettings by owner only", async () => {
    const freeMinting = false;
    const percFee = 80;
    const minFee = ethers.utils.parseEther("0.01");
    await expect(
      cryptoCocks.connect(owner).changeFeeSettings(freeMinting, percFee, minFee)
    ).to.not.be.reverted;

    await expect(
      cryptoCocks
        .connect(nonOwner)
        .changeFeeSettings(freeMinting, percFee, minFee)
    ).to.be.reverted;
  });

  it("should not be possible to have zero percFee without freeMinting", async () => {
    const freeMinting = false;
    const percFee = 0;
    const minFee = ethers.utils.parseEther("0.02");
    await expect(
      cryptoCocks.connect(owner).changeFeeSettings(freeMinting, percFee, minFee)
    ).to.be.revertedWith("DIVIDE_BY_ZERO");
  });
});
