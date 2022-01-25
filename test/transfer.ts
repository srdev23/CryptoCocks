import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { Accounts, Contracts, deploy, getAccounts } from "./deploy";

describe("Transfers", function () {
  let contracts: Contracts;
  let accounts: Accounts;

  beforeEach(async () => {
    accounts = getAccounts(await ethers.getSigners());
    contracts = await deploy(accounts);
  });

  xit("should not be possible to withdraw balance for non-whitelisted wallets", async () => {
    // TODO MF
    expect(1).to.equal(0);
  });

  xit("should be possible to withdraw balance for whitelisted wallet", async () => {
    expect(1).to.equal(0);
  });

  xit("should transfer fees with every 50th mint", async () => {
    expect(1).to.equal(0);
    // const TEAM_WALLET = "0xb1eE86786875E110A5c1Ab8cB6BA2ad21994E60e";
    // const DONATION_WALLET = "0x1ea471c91Ad6cbCFa007FBd6A605522519f9FD64";

    // if (parseInt(tokenId) % 50 === 0) {
    //   const provider = waffle.provider;
    //   totalFees = totalFees.add(batchFees);
    //
    //   expect(await provider.getBalance(TEAM_WALLET)).to.closeTo(
    //     totalFees.div(2),
    //     100
    //   );
    //   expect(await provider.getBalance(DONATION_WALLET)).to.closeTo(
    //     totalFees.div(10).mul(3),
    //     100
    //   );
    //   // reset batchFees for next 50 mints
    //   batchFees = BigNumber.from("0");
    // }
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
