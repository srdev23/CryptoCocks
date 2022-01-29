import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Contracts, deploy } from "./deploy";
import {
  expectToken,
  mint,
  setContractToPublicSale,
  getMinter,
  // eslint-disable-next-line node/no-missing-import
} from "./helper";
import {ADD_ACCOUNTS} from "../accounts";
// eslint-disable-next-line node/no-missing-import
import { loadPercentileData, PercentileDataEntry } from "./percentiles";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const INIT_MINT_COUNT = 30;

describe("Local Run", function () {
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

  describe("Mint Complete Token supply", function () {
    xit("should be able to mint 10000 tokens", async () => {
      for (let i = 0; i < ADD_ACCOUNTS + 1; i++) {
        const minter = await getMinter(minters, 4, i, percentileData);
        const tx = await mint(contracts.cryptoCocks, minter);
        console.log(i)

        await expectToken(
          contracts.cryptoCocks,
          await tx,
          percentileData[i].length_new,
          i + 1
        );
      }
    });
  });  

});
