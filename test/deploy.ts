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

// TODO MF: Delete this
export interface Accounts {
  owner: SignerWithAddress;
  nonOwner: SignerWithAddress;
  communityWallet1: SignerWithAddress;
  communityWallet2: SignerWithAddress;
  signerTokenOneBelow: SignerWithAddress;
  signerTokenTwoBelow: SignerWithAddress;
  signerTokenOneAbove3: SignerWithAddress;
  signerTokenOneAbove1: SignerWithAddress;
  signerTokenOneAbove2: SignerWithAddress;
  signerTokenTwoAbove: SignerWithAddress;
  signerTokenBothAbove: SignerWithAddress;
  freeSigner: SignerWithAddress;
  minters: SignerWithAddress[];
}

export interface Contracts {
  cryptoCocks: CryptoCocks;
  testTokenOne: TestToken;
  testTokenTwo: TestToken;
}

// TODO MF: Delete this!
export function getAccounts(signers: SignerWithAddress[]): Accounts {
  const accounts = {} as Accounts;

  // main accounts
  accounts.owner = signers[0];
  accounts.nonOwner = signers[1];

  // non-minters
  const [communityWallet1, communityWallet2] = signers.slice(1, 3);
  accounts.communityWallet1 = communityWallet1;
  accounts.communityWallet2 = communityWallet2;

  const [signerTokenOneBelow, signerTokenTwoBelow, signerTokenOneAbove3] =
    signers.slice(3, 6);
  accounts.signerTokenOneBelow = signerTokenOneBelow;
  accounts.signerTokenTwoBelow = signerTokenTwoBelow;
  accounts.signerTokenOneAbove3 = signerTokenOneAbove3;

  const [
    signerTokenOneAbove1,
    signerTokenOneAbove2,
    signerTokenTwoAbove,
    signerTokenBothAbove,
  ] = signers.slice(6, 10);
  accounts.signerTokenOneAbove1 = signerTokenOneAbove1;
  accounts.signerTokenOneAbove2 = signerTokenOneAbove2;
  accounts.signerTokenTwoAbove = signerTokenTwoAbove;
  accounts.signerTokenBothAbove = signerTokenBothAbove;

  accounts.freeSigner = signers[10];
  accounts.minters = signers.slice(11);

  return accounts;
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

  // deploy crypto cocks contract
  const CryptoCocks = await ethers.getContractFactory("CryptoCocks", {
    libraries: {
      OrderStatisticsTreeLib: orderStatisticsTreeLib.address,
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
export async function deploy(accounts: Accounts): Promise<Contracts> {
  const contracts = {} as Contracts;
  contracts.cryptoCocks = await deployContracts(accounts.owner);
  const [contract1, contract2] = await deployTestTokenContracts(accounts.owner);
  contracts.testTokenOne = contract1;
  contracts.testTokenTwo = contract2;
  return contracts;
}
