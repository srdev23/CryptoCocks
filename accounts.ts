// eslint-disable-next-line node/no-missing-import,node/no-unpublished-import
import { loadPercentileData, PercentileDataEntry } from "./test/percentiles";
// eslint-disable-next-line node/no-unpublished-import
import { HardhatNetworkAccountUserConfig } from "hardhat/types";
// eslint-disable-next-line node/no-unpublished-import
import { utils } from "ethers";
// eslint-disable-next-line node/no-unpublished-import
import { deriveKeyFromMnemonicAndPath } from "hardhat/internal/util/keys-derivation";
// eslint-disable-next-line node/no-unpublished-import
import { bufferToHex } from "ethereumjs-util";
import * as fs from "fs";

const MNEMONIC =
  "hollow cycle obscure tumble office alarm slam fragile online peace wink together";
const HD_PATH = "m/44'/60'/0'/0/";

export const NUM_CHUNKS = 4;
export const MAXIMUM = 100;
export const ADD_ACCOUNTS = 9970;

loadPercentileData().then((data: PercentileDataEntry[]) => {
  let chunks: HardhatNetworkAccountUserConfig[] = [];
  let counter = 5;
  for (let i = 0; i < NUM_CHUNKS; i++) {
    const chunk = [];
    for (let j = 0; j < MAXIMUM; j++) {
      const account: HardhatNetworkAccountUserConfig = {
        balance: utils.parseEther(data[j].balance).toString(),
        privateKey: bufferToHex(
          deriveKeyFromMnemonicAndPath(MNEMONIC, `${HD_PATH}${counter}`)!
        ),
      };
      chunk.push(account);
      counter++;
    }
    chunks = chunks.concat(chunk);
  }

  for (let k = 0; k < ADD_ACCOUNTS; k++) {
    const account: HardhatNetworkAccountUserConfig = {
      balance: utils.parseEther(data[k].balance).toString(),
      privateKey: bufferToHex(
        deriveKeyFromMnemonicAndPath(MNEMONIC, `${HD_PATH}${counter}`)!
      ),
    };
    chunks.push(account);
    counter++;
  }

  let accounts = [];

  // add owner
  accounts.push({
    balance: utils.parseEther("100").toString(),
    privateKey: bufferToHex(
      deriveKeyFromMnemonicAndPath(MNEMONIC, HD_PATH + "0")!
    ),
  });

  // add signer 1
  accounts.push({
    balance: utils.parseEther("100").toString(),
    privateKey: bufferToHex(
      deriveKeyFromMnemonicAndPath(MNEMONIC, HD_PATH + "1")!
    ),
  });

  // add signer 2
  accounts.push({
    balance: utils.parseEther("100").toString(),
    privateKey: bufferToHex(
      deriveKeyFromMnemonicAndPath(MNEMONIC, HD_PATH + "2")!
    ),
  });

  // add signer 3
  accounts.push({
    balance: utils.parseEther("100").toString(),
    privateKey: bufferToHex(
      deriveKeyFromMnemonicAndPath(MNEMONIC, HD_PATH + "3")!
    ),
  });

  // add signer 4
  accounts.push({
    balance: utils.parseEther("100").toString(),
    privateKey: bufferToHex(
      deriveKeyFromMnemonicAndPath(MNEMONIC, HD_PATH + "4")!
    ),
  });

  accounts = accounts.concat(chunks);

  fs.writeFileSync("accounts.json", JSON.stringify(accounts));
});
