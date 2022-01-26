// eslint-disable-next-line node/no-missing-import
import { CryptoCocks, TestToken } from "../typechain";
import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, ContractTransaction, Signer } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

/**
 * Sets contract to free sale settings
 */
export async function setContractToFreeSale(
  contract: CryptoCocks,
  owner: Signer
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
  owner: Signer
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
  owner: Signer
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
 * Return 1% of the signer's wallet balance or
 * when necessary a minimum of 0.02 Ether.
 *
 * @param signer Signer
 */
export async function getMintValue(signer: Signer) {
  const balance = await signer.getBalance();
  let value = balance.div(100); // 1% or 1/100 of balance
  if (!value.gte(ethers.utils.parseEther("0.02"))) {
    value = ethers.utils.parseEther("0.02"); // minimum of 0.02 Eth
  }
  return value;
}

/**
 * Adds a whitelisted community token contract and
 * asserts that everything went as supposed.
 *
 * @param cryptoCocks Deployed CryptoCocks contract
 * @param owner Owner account that deployed the CryptoCocks contract
 * @param testToken TestToken contract
 * @param communityWallet Signer
 * @param maxSupply Maximum supply
 * @param minBalance Minimum balance
 * @param percRoyal Percentage royalties
 */
export async function addWhitelistedContract(
  cryptoCocks: CryptoCocks,
  owner: Signer,
  testToken: TestToken,
  communityWallet: SignerWithAddress,
  maxSupply: number,
  minBalance: number,
  percRoyal: number
) {
  const cc = testToken.address;
  const wallet = communityWallet.address;

  const initialSettings = await cryptoCocks.set();
  const initialNumContracts = initialSettings.numContracts;

  await expect(
    cryptoCocks
      .connect(owner)
      .addWhiteListing(cc, wallet, maxSupply, minBalance, percRoyal)
  ).to.not.be.reverted;

  const settings = await cryptoCocks.set();
  const numContracts = settings.numContracts;
  const whiteListed = await cryptoCocks.list(numContracts - 1); // index starts with 0

  expect(numContracts).to.equal(initialNumContracts + 1);
  expect(whiteListed.percRoyal).to.equal(percRoyal);
  expect(whiteListed.maxSupply).to.equal(maxSupply);
  expect(whiteListed.minBalance).to.equal(minBalance);
  expect(whiteListed.tracker).to.equal(0);
  expect(whiteListed.balance.toNumber()).to.equal(0);
  expect(whiteListed.cc).to.equal(testToken.address);
  expect(whiteListed.wallet).to.equal(communityWallet.address);
}

/**
 * Mint test tokens for some wallet and
 * assert that everything worked as supposed
 *
 * @param signer Wallet that receives the test tokens
 * @param cryptoCocks Deployed CryptoCocks contract
 * @param testToken Deployed TestToken contract
 * @param times Number of tokens given to the signer
 */
export async function mintTestToken(
  signer: SignerWithAddress,
  cryptoCocks: CryptoCocks,
  testToken: TestToken,
  times: number
) {
  const receiptPromises = [...Array(times)].map(async () => {
    return testToken.connect(signer).mint(signer.address);
  });
  // wait for all transactions and then assert balance
  Promise.all(receiptPromises).then(async () => {
    const balance = await cryptoCocks.queryBalance(
      testToken.address,
      signer.address
    );
    expect(balance).to.equal(BigNumber.from(times));
  });
}

export async function mint(
  cryptoCocks: CryptoCocks,
  minter: SignerWithAddress
) {
  const value = await getMintValue(minter);
  const pTx = cryptoCocks.connect(minter).mint({
    value,
  });
  await expect(() => pTx).to.changeEtherBalance(minter, value.mul(-1));
  await expect(pTx).to.not.be.reverted;
  return pTx;
}

export async function mintRevert(
  cryptoCocks: CryptoCocks,
  minter: SignerWithAddress,
  reason: string = "LOCK"
) {
  const value = await getMintValue(minter);
  const pTx = cryptoCocks.connect(minter).mint({
    value,
  });
  await expect(pTx).to.be.revertedWith(reason);
}

export function expectToken(
  cryptoCocks: CryptoCocks,
  mintTx: ContractTransaction,
  length: string,
  tokenId: number
) {
  expect(mintTx)
    .to.emit(cryptoCocks, "PermanentURI")
    .withArgs(`${length}/${tokenId}/metadata.json`, BigNumber.from(tokenId));
}
