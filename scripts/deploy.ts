import * as dotenv from "dotenv";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { CryptoCocks } from "../typechain";
import {
  saveABIJson,
  saveAddressesJson,
  saveChainJson,
  saveOwnerJson,
  // eslint-disable-next-line node/no-missing-import
} from "./generator";
dotenv.config();

async function main() {
  // deploy libraries
  const OrderStatisticsTreeLib = await ethers.getContractFactory(
    "OrderStatisticsTreeLib"
  );
  const orderStatisticsTreeLib = await OrderStatisticsTreeLib.deploy();
  await orderStatisticsTreeLib.deployed();
  console.log(
    "OrderStatisticsTreeLib contract deployed to:",
    orderStatisticsTreeLib.address
  );

  const CryptoCocksLib = await ethers.getContractFactory("CryptoCocksLib");
  const cryptoCocksLib = await CryptoCocksLib.deploy();
  await cryptoCocksLib.deployed();
  console.log("CryptoCocksLib contract deployed to:", cryptoCocksLib.address);

  const CryptoCocksWhitelistingLib = await ethers.getContractFactory(
    "CryptoCocksWhitelistingLib"
  );
  const cryptoCocksWhitelistingLib = await CryptoCocksWhitelistingLib.deploy();
  await cryptoCocksWhitelistingLib.deployed();
  console.log(
    "CryptoCocksWhitelistingLib contract deployed to:",
    cryptoCocksWhitelistingLib.address
  );

  // deploy crypto cocks contract
  const CryptoCocks = await ethers.getContractFactory("CryptoCocks", {
    libraries: {
      OrderStatisticsTreeLib: orderStatisticsTreeLib.address,
      CryptoCocksLib: cryptoCocksLib.address,
      CryptoCocksWhitelistingLib: cryptoCocksWhitelistingLib.address,
    },
  });
  const cryptoCocks = (await CryptoCocks.deploy()) as CryptoCocks;
  await cryptoCocks.deployed();
  console.log("CryptoCocks contract deployed to:", cryptoCocks.address);

  const generate = process.env.GENERATE === "true";

  if (generate) {
    const signers = await ethers.getSigners();
    const owner = signers[0];
    const network = await ethers.getDefaultProvider().getNetwork();
    const chainId = network.chainId;

    saveOwnerJson(owner.address);
    saveChainJson(chainId);
    saveAddressesJson({
      CryptoCocks: cryptoCocks.address,
    });
    saveABIJson("CryptoCocks");
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
