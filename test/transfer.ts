import { expect } from "chai";
import { ethers, waffle } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Contracts, deploy } from "./deploy";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  assertCollectedBalance,
  getMinter,
  getMintValue,
  mint,
  // eslint-disable-next-line node/no-missing-import
} from "./helper";
import { BigNumber, Signer } from "ethers";

const PERCENTAGE_TEAM = 50;
const PERCENTAGE_DONATION = 30;
const PERCENTAGE_COMMUNITIES = 20;

const TEAM_WALLET = "0xb1eE86786875E110A5c1Ab8cB6BA2ad21994E60e";
const DONATION_WALLET = "0x1ea471c91Ad6cbCFa007FBd6A605522519f9FD64";

describe.only("Transfers", function () {
  let contracts: Contracts;
  let owner: SignerWithAddress;
  let signer1: SignerWithAddress;
  let minters: SignerWithAddress[];
  let team: Signer;
  let donation: Signer;

  beforeEach(async () => {
    [owner, signer1, , , , ...minters] = await ethers.getSigners();
    contracts = await deploy(owner);
    const provider = waffle.provider;
    team = provider.getSigner(TEAM_WALLET);
    donation = provider.getSigner(DONATION_WALLET);
  });

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
      value.div(100).mul(PERCENTAGE_TEAM),
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
      value.div(100).mul(PERCENTAGE_DONATION),
      "donation"
    );
  });

  xit("should not be possible to withdraw balance for non-whitelisted wallets", async () => {
    expect(1).to.equal(0);
  });

  xit("should be possible to withdraw balance for whitelisted wallet", async () => {
    expect(1).to.equal(0);
  });

  it("should transfer fees with every 50th mint", async () => {
    expect(await team.getBalance()).to.equal(BigNumber.from(0));

    let valueSum = BigNumber.from(0);
    for (let i = 0; i < 100; i++) {
      const minter = await getMinter(minters, 3, i);
      const value = await getMintValue(minter);
      valueSum = valueSum.add(value);
      const tx = mint(contracts.cryptoCocks, minter);

      // note: token id counter begins with 1
      if ((i + 1) % 50 === 0) {
        await expect(() => tx).to.changeEtherBalance(
          team,
          valueSum.div(100).mul(PERCENTAGE_TEAM)
        );
        await expect(() => tx).to.changeEtherBalance(
          donation,
          valueSum.div(100).mul(PERCENTAGE_DONATION)
        );
        valueSum = BigNumber.from(0);
      }
    }
  });

  //   it("should not be possible to withdraw balance for non-whitelisted wallets", async () => {
  //     const nonCommunityWallets = signers;
  //     nonCommunityWallets.push(
  //       accounts.owner,
  //       accounts.freeSigner,
  //       accounts.signerTokenOneBelow,
  //       accounts.signerTokenOneAbove1,
  //       accounts.signerTokenOneAbove2,
  //       accounts.signerTokenOneAbove3,
  //       accounts.signerTokenTwoBelow,
  //       accounts.signerTokenTwoAbove,
  //       accounts.signerTokenBothAbove
  //     );
  //
  //     for (let i = 0; i < nonCommunityWallets.length; i++) {
  //       const prevBalance = await nonCommunityWallets[i].getBalance();
  //       const transferTx = await contracts.cryptoCocks
  //         .connect(nonCommunityWallets[i])
  //         .transferRoyalty();
  //       const receipt = await transferTx.wait();
  //       const gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
  //       const newBalance = await nonCommunityWallets[i].getBalance();
  //       // No change other than gas costs expected for the wallet balance
  //       expect(prevBalance.sub(gasCost)).to.equal(newBalance);
  //     }
  //   });
  //
  //   it("should be possible to withdraw balance for white listed wallet", async () => {
  //     const communityWallets = [
  //       accounts.communityWallet1,
  //       accounts.communityWallet2,
  //     ];
  //     for (let i = 0; i < communityWallets.length; i++) {
  //       const prevBalance = await communityWallets[i].getBalance();
  //       const contract = await contracts.cryptoCocks.list(i);
  //       const transferTx = await contracts.cryptoCocks
  //         .connect(communityWallets[i])
  //         .transferRoyalty();
  //       const receipt = await transferTx.wait();
  //       // Get gas cost as recipient is also sender of transaction
  //       const gasCost = receipt.cumulativeGasUsed.mul(receipt.effectiveGasPrice);
  //       const newBalance = await communityWallets[i].getBalance();
  //       const diff = newBalance.sub(prevBalance);
  //       // Add gas cost to wallet balance to match contract balance
  //       expect(diff.add(gasCost)).to.equal(contract.balance);
  //
  //       // Check balance in contract after transfer
  //       const contractAfter = await contracts.cryptoCocks.list(i);
  //       expect(contractAfter.balance).to.equal(BigNumber.from("0"));
  //     }
  //   });
});
