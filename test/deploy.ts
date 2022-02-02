import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import {
  CryptoCocks,
  TestToken,
  // eslint-disable-next-line node/no-missing-import
} from "../typechain";
// eslint-disable-next-line node/no-missing-import
import { Signer } from "ethers";

export interface Contracts {
  cryptoCocks: CryptoCocks;
  testTokenOne: TestToken;
  testTokenTwo: TestToken;
}

/**
 * Deploys the OrderStatisticsTreeLib and CryptoCocks contract.
 * Also links the library and the CryptoCocks contract.
 */
export async function deployContracts(signer: Signer) {
  // deploy libraries
  const OrderStatisticsTreeLib = await ethers.getContractFactory(
    "OrderStatisticsTreeLib",
    signer
  );
  const orderStatisticsTreeLib = await OrderStatisticsTreeLib.deploy();
  await orderStatisticsTreeLib.deployed();

  const CryptoCocksLib = await ethers.getContractFactory(
    "CryptoCocksLib",
    signer
  );
  const cryptoCocksLib = await CryptoCocksLib.deploy();
  await cryptoCocksLib.deployed();

  // deploy crypto cocks contract
  const CryptoCocks = await ethers.getContractFactory("CryptoCocks", {
    libraries: {
      OrderStatisticsTreeLib: orderStatisticsTreeLib.address,
      CryptoCocksLib: cryptoCocksLib.address,
    },
    signer,
  });
  const cryptoCocks = (await CryptoCocks.deploy()) as CryptoCocks;
  await cryptoCocks.deployed();

  return cryptoCocks;
}

/**
 * Deploys the test token contracts
 */
export async function deployTestTokenContracts(signer: Signer) {
  // deploy TestTokenOne contract
  const TestTokenOne = await ethers.getContractFactory("TestToken", signer);
  const testTokenOne = (await TestTokenOne.deploy()) as TestToken;
  await testTokenOne.deployed();

  // deploy TestTokenTwo contract
  const TestTokenTwo = await ethers.getContractFactory("TestToken", signer);
  const testTokenTwo = (await TestTokenTwo.deploy()) as TestToken;
  await testTokenTwo.deployed();

  return [testTokenOne, testTokenTwo];
}

/**
 * Deploys the OrderStatisticsTreeLib and CryptoCocks contract.
 * Also links the library and the CryptoCocks contract.
 */
export async function deploy(owner: SignerWithAddress): Promise<Contracts> {
  const contracts = {} as Contracts;
  contracts.cryptoCocks = await deployContracts(owner);
  const [contract1, contract2] = await deployTestTokenContracts(owner);
  contracts.testTokenOne = contract1;
  contracts.testTokenTwo = contract2;
  return contracts;
}
