import fs from "fs";
import path from "path";

export function saveOwnerJson(owner: string) {
  const exists = (folder: string) =>
    fs.existsSync(
      path.join(__dirname, `../../${folder}/src/contracts/owner.json`)
    );
  const create = (folder: string) =>
    fs.writeFileSync(
      path.join(__dirname, `../../${folder}/src/contracts/owner.json`),
      "{}"
    );
  if (!exists("api")) {
    create("api");
  }

  // save json
  const write = (folder: string) =>
    fs.writeFileSync(
      path.join(__dirname, `../../${folder}/src/contracts/owner.json`),
      JSON.stringify({ owner })
    );
  write("api");
}

export function saveChainJson(chainId: number) {
  const exists = (folder: string) =>
    fs.existsSync(
      path.join(__dirname, `../../${folder}/src/contracts/chain.json`)
    );
  const create = (folder: string) =>
    fs.writeFileSync(
      path.join(__dirname, `../../${folder}/src/contracts/chain.json`),
      "{}"
    );
  if (!exists("frontend")) {
    create("frontend");
  }
  if (!exists("api")) {
    create("api");
  }

  // save json
  const write = (folder: string) =>
    fs.writeFileSync(
      path.join(__dirname, `../../${folder}/src/contracts/chain.json`),
      JSON.stringify({ id: chainId })
    );
  write("frontend");
  write("api");
}

export function saveAddressesJson(addressesJson: any) {
  // check if addresses.json already exists
  // if not, created the file
  const exists = (folder: string) =>
    fs.existsSync(
      path.join(__dirname, `../../${folder}/src/contracts/addresses.json`)
    );
  const create = (folder: string) =>
    fs.writeFileSync(
      path.join(__dirname, `../../${folder}/src/contracts/addresses.json`),
      "{}"
    );
  if (!exists("frontend")) {
    create("frontend");
  }
  if (!exists("api")) {
    create("api");
  }

  // save json
  const write = (folder: string) =>
    fs.writeFileSync(
      path.join(__dirname, `../../${folder}/src/contracts/addresses.json`),
      JSON.stringify(addressesJson)
    );
  write("frontend");
  write("api");
}

export function saveABIJson(contractName: string) {
  // copy the contract JSON file (ABI file) to frontend/api
  const copy = (folder: string) =>
    fs.copyFileSync(
      path.join(
        __dirname,
        `../artifacts/contracts/${contractName}.sol/${contractName}.json`
      ), // source
      path.join(
        __dirname,
        `../../${folder}/src/contracts/abi/` + contractName + ".json"
      ) // destination
    );
  copy("frontend");
  copy("api");
}
