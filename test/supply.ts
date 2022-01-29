// import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Contracts, deploy } from "./deploy";
import {
  expectToken,
  mint,
  setContractToPublicSale,
  getMinter,
  mintRevert,
  // eslint-disable-next-line node/no-missing-import
} from "./helper";
// eslint-disable-next-line node/no-missing-import
import { loadPercentileData, PercentileDataEntry } from "./percentiles";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe.skip("Maximum Supply", function () {
  let contracts: Contracts;
  let owner: SignerWithAddress;
  let minters: SignerWithAddress[];
  let percentileData: PercentileDataEntry[];
  let signer1: SignerWithAddress;

  before(async () => {
    [owner, signer1, , , , ...minters] = await ethers.getSigners();
    contracts = await deploy(owner);
    percentileData = await loadPercentileData();
    await setContractToPublicSale(contracts.cryptoCocks, owner);
  });

  it("should be able to mint max 10000 tokens", async function () {
    for (let i = 0; i < 10000; i++) {
      const minter = await getMinter(minters, 4, i, percentileData);
      const tx = await mint(contracts.cryptoCocks, minter);
      if (i % 100 === 0) {
        console.log("Mint token %i", i + 1);
      }
      await expectToken(
        contracts.cryptoCocks,
        await tx,
        percentileData[i].length,
        i + 1
      );
    }
  }).timeout(0);

  it("should not be possible to mint more than possible token supply", async () => {
    await mintRevert(contracts.cryptoCocks, signer1, "TOTAL_SUPPLY_REACHED");
  });
});
