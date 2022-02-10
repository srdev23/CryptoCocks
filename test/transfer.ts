import { expect } from "chai";
import { ethers, waffle } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Contracts, deploy } from "./deploy";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  addWhitelistedContract,
  assertCollectedBalance,
  getMinter,
  getMintValue,
  mint,
  mintTestToken,
  setContractToPublicSale,
  // eslint-disable-next-line node/no-missing-import
} from "./helper";
import { BigNumber, Signer } from "ethers";
// eslint-disable-next-line node/no-missing-import
import { TestToken } from "../typechain";
// eslint-disable-next-line node/no-missing-import
import { loadPercentileData, PercentileDataEntry } from "./percentiles";

const PERCENTAGE_TEAM = 50;
const PERCENTAGE_DONATION = 30;

const TEAM_WALLET = "0x5b1f57449Dd479e787FDF201a59d06D3Cb84F5Dc";
const DONATION_WALLET = "0xb1019Eb5e90aD29C2FcE82AAB712325a1A3d5924";

describe("Transfers", function () {
  let contracts: Contracts;
  let owner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let signer2: SignerWithAddress;
  let signer3: SignerWithAddress;
  let minters: SignerWithAddress[];
  let team: Signer;
  let donation: Signer;
  let percentileData: PercentileDataEntry[];

  beforeEach(async () => {
    [owner, signer1, signer2, signer3, , ...minters] =
      await ethers.getSigners();
    contracts = await deploy(owner);
    const provider = waffle.provider;
    team = provider.getSigner(TEAM_WALLET);
    donation = provider.getSigner(DONATION_WALLET);
    percentileData = await loadPercentileData();
    await setContractToPublicSale(contracts.cryptoCocks, owner);
  });

  describe("Split Sent Ether", function () {
    it("should collect 50% of sent ether for the team", async () => {
      await assertCollectedBalance(
        contracts.cryptoCocks,
        BigNumber.from(0),
        "team"
      );

      // mint
      const minter = signer1;
      const value = await getMintValue(minter);
      await mint(contracts.cryptoCocks, minter);

      await assertCollectedBalance(
        contracts.cryptoCocks,
        value.mul(PERCENTAGE_TEAM).div(100),
        "team"
      );
    });

    it("should collect 30% of sent ether for donation", async () => {
      await assertCollectedBalance(
        contracts.cryptoCocks,
        BigNumber.from(0),
        "team"
      );

      // mint
      const minter = signer1;
      const value = await getMintValue(minter);
      await mint(contracts.cryptoCocks, minter);

      await assertCollectedBalance(
        contracts.cryptoCocks,
        value.mul(PERCENTAGE_DONATION).div(100),
        "donation"
      );
    });
  });

  describe("Community Royalties", function () {
    const percRoyal = 10; // community wallet will receive 10% of sent value when minting
    const maxSupply = 2;
    const minBalance = 100;
    let communityWallet: SignerWithAddress;
    let nonCommunityWallet: SignerWithAddress;
    let communityToken: TestToken;
    let communityTokenHolder: SignerWithAddress;
    let nonCommunityTokenHolder: SignerWithAddress;

    beforeEach(async () => {
      communityWallet = signer1;
      communityTokenHolder = signer2;
      nonCommunityTokenHolder = signer3;
      nonCommunityWallet = signer3;
      communityToken = contracts.testTokenOne;

      await addWhitelistedContract(
        contracts.cryptoCocks,
        owner,
        communityToken,
        communityWallet,
        maxSupply,
        minBalance,
        percRoyal
      );

      await mintTestToken(
        communityTokenHolder,
        contracts.cryptoCocks,
        contracts.testTokenOne,
        minBalance
      );
    });

    it("should be possible to withdraw community royalty by community wallet", async () => {
      const value = await getMintValue(nonCommunityTokenHolder);
      const mintTx = mint(contracts.cryptoCocks, nonCommunityTokenHolder);

      // expect value sent from nonCommunityTokenHolder to contract when minting
      await expect(() => mintTx).to.changeEtherBalances(
        [nonCommunityTokenHolder, contracts.cryptoCocks],
        [value.mul(-1), value]
      );

      // transfer royalty from contract to community wallet
      const transferTx = await contracts.cryptoCocks
        .connect(communityWallet)
        .transferRoyalty();

      // expect royalties to be sent to community wallet
      const expectedRoyalty = value.mul(percRoyal).div(100);
      await expect(() => transferTx).to.changeEtherBalances(
        [contracts.cryptoCocks, communityWallet],
        [expectedRoyalty.mul(-1), expectedRoyalty]
      );
    });

    it("should not be possible to withdraw community royalty by non community wallet", async () => {
      // transfer royalty from contract to community wallet
      await expect(
        contracts.cryptoCocks.connect(nonCommunityWallet).transferRoyalty()
      ).to.be.revertedWith("NO_COMMUNITY_WALLET");
    });
  });

  it("should transfer fees with every 50th mint", async () => {
    let valueSum = BigNumber.from(0);
    for (let i = 1; i <= 100; i++) {
      const minter = await getMinter(minters, i - 1, percentileData); // token id begins with 1
      const value = await getMintValue(minter);
      valueSum = valueSum.add(value);
      const tx = mint(contracts.cryptoCocks, minter);

      const tokenId = i + 30;
      if (tokenId % 50 === 0) {
        await expect(() => tx).to.changeEtherBalances(
          [team, donation],
          [
            valueSum.div(100).mul(PERCENTAGE_TEAM),
            valueSum.div(100).mul(PERCENTAGE_DONATION),
          ]
        );
        valueSum = BigNumber.from(0);
      }
    }
  });
});
