import { parseFile } from "@fast-csv/parse";
// eslint-disable-next-line node/no-missing-import
import { CryptoCocks, TestTokenOne, TestTokenTwo } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";

export interface PercentileDataEntry {
  token_id: string;
  balance: string;
  length: string;
  length_new: string;
}

/**
 * Loads the data from the file `percentiles.csv`
 */
export async function loadPercentileData(): Promise<PercentileDataEntry[]> {
  // eslint-disable-next-line no-async-promise-executor
  return new Promise<PercentileDataEntry[]>(async (resolve, reject) => {
    const entries: PercentileDataEntry[] = [];
    parseFile("percentiles.csv", { headers: true })
      .on("error", (error) => {
        return reject(error);
      })
      .on("data", (entry: PercentileDataEntry) => {
        entries.push(entry);
      })
      .on("end", () => {
        return resolve(entries);
      });
  });
}

/**
 * Sets contract to free sale settings
 */
export async function setContractToFreeSale(
  contract: CryptoCocks,
  owner: SignerWithAddress
) {
  await contract.connect(owner).changePublicSaleStatus(true);
  await contract.connect(owner).changeFeeSettings(true, 0, 0);
  const settings = await contract.set();

  // assert settings
  expect(settings.publicSaleStatus).to.equal(true);
  expect(settings.freeMinting).to.equal(true);
  expect(settings.percFee).to.equal(0);
  expect(settings.minFee).to.equal(0);
}

/**
 * Sets contract to private sale settings
 */
export async function setContractToPrivateSale(
  contract: CryptoCocks,
  owner: SignerWithAddress
) {
  await contract.connect(owner).changePublicSaleStatus(false);
  await contract
    .connect(owner)
    .changeFeeSettings(false, 100, ethers.utils.parseEther("0.02"));
  const settings = await contract.set();

  // assert settings
  expect(settings.publicSaleStatus).to.equal(false);
  expect(settings.freeMinting).to.equal(false);
  expect(settings.percFee).to.equal(100);
  expect(settings.minFee).to.equal(ethers.utils.parseEther("0.02"));
}

/**
 * Sets contract to public sale settings
 */
export async function setContractToPublicSale(
  contract: CryptoCocks,
  owner: SignerWithAddress
) {
  await contract.connect(owner).changePublicSaleStatus(true);
  await contract
    .connect(owner)
    .changeFeeSettings(false, 100, ethers.utils.parseEther("0.02"));
  const settings = await contract.set();

  // assert settings
  expect(settings.publicSaleStatus).to.equal(true);
  expect(settings.freeMinting).to.equal(false);
  expect(settings.percFee).to.equal(100);
  expect(settings.minFee).to.equal(ethers.utils.parseEther("0.02"));
}

/**
 * Deploys the OrderStatisticsTreeLib and CryptoCocks contract.
 * Also links the library and the CryptoCocks contract.
 */
export async function deployContracts() {
  // deploy libraries
  const OrderStatisticsTreeLib = await ethers.getContractFactory(
    "OrderStatisticsTreeLib"
  );
  const orderStatisticsTreeLib = await OrderStatisticsTreeLib.deploy();
  await orderStatisticsTreeLib.deployed();

  // deploy crypto cocks contract
  const CryptoCocks = await ethers.getContractFactory("CryptoCocks", {
    libraries: {
      OrderStatisticsTreeLib: orderStatisticsTreeLib.address,
    },
  });
  const cryptoCocks = (await CryptoCocks.deploy()) as CryptoCocks;
  await cryptoCocks.deployed();

  // separate accounts
  const signers = await ethers.getSigners();
  const owner = signers[0];
  const nonOwner = signers[1];

  return {
    cryptoCocks,
    owner,
    nonOwner,
  };
}

/**
 * Deploys the test token contracts
 */
export async function deployTestTokens() {
  // deploy TestTokenOne contract
  const TestTokenOne = await ethers.getContractFactory("TestTokenOne");
  const testTokenOne = (await TestTokenOne.deploy()) as TestTokenOne;
  await testTokenOne.deployed();

  // deploy TestTokenTwo contract
  const TestTokenTwo = await ethers.getContractFactory("TestTokenTwo");
  const testTokenTwo = (await TestTokenTwo.deploy()) as TestTokenTwo;
  await testTokenTwo.deployed();

  return {
    testTokenOne,
    testTokenTwo,
  };
}
