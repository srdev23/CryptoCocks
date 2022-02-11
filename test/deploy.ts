import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { CryptoCocks, TestToken } from "../typechain";
import { BigNumber, Signer } from "ethers";
import { setBalance } from "./helper";

import * as dotenv from "dotenv";
dotenv.config();

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

  const CryptoCocksWhitelistingLib = await ethers.getContractFactory(
    "CryptoCocksWhitelistingLib",
    signer
  );
  const cryptoCocksWhitelistingLib = await CryptoCocksWhitelistingLib.deploy();
  await cryptoCocksWhitelistingLib.deployed();

  const cryptoCocksLibAddress = process.env.USE_DEPLOYED
    ? "0xf31E24AeD8eB6Dd2218683B0bCE29Ed3387b16B9"
    : cryptoCocksLib.address;
  const orderStatisticsTreeLibAddress = process.env.USE_DEPLOYED
    ? "0x0A78bB5c3F3Bf99f78c2D440f2C10712Ce413109"
    : orderStatisticsTreeLib.address;

  // deploy crypto cocks contract
  const CryptoCocks = await ethers.getContractFactory("CryptoCocks", {
    libraries: {
      OrderStatisticsTreeLib: orderStatisticsTreeLibAddress,
      CryptoCocksLib: cryptoCocksLibAddress,
      CryptoCocksWhitelistingLib: cryptoCocksWhitelistingLib.address,
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
  await setBalance(owner, BigNumber.from(ethers.utils.parseEther("10"))); // make sure owner has enough funds
  const contracts = {} as Contracts;
  contracts.cryptoCocks = await deployContracts(owner);
  const [contract1, contract2] = await deployTestTokenContracts(owner);
  contracts.testTokenOne = contract1;
  contracts.testTokenTwo = contract2;
  return contracts;
}
