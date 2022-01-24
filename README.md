 <a href="https://codecov.io/gh/cocodigrande2021/cryptococks-contract">
    <img src="https://codecov.io/gh/cocodigrande2021/cryptococks-contract/branch/master/graph/badge.svg?token=SU15AOAFWE"/>
</a>

<a href="https://cryptococks.xyz/">
 <p align="center">
   <img src="https://github.com/cocodigrande2021/cryptococks-contract/raw/master/logo.png" width="320" alt="CryptoCocks" />
 </p>
</a>

# CryptoCocks

[CryptoCocks (cryptococks.xyz)](cryptococks.xyz) is a decentralized generative art project where the rarity of the unique digital collectibles ([ERC721 NFTs](https://ethereum.org/en/developers/docs/standards/tokens/erc-721/#top)) not only is determined by pseudo-randomly assigned
traits of varying frequency but also how someone's wallet balance at the time of minting compares
with the wallet balance of previous minters at the time they minted their token. CryptoCocks tokens are fair-priced meaning that the cost for minting will always be 1% of that minter's wallet balance and is primarily decisive for the rarity of the minted NFT.
The total supply of CryptoCocks is limited to 10000 unique tokens and each image is stored decentrally on [IPFS](https://ipfs.io) and [Filecoin](https://filecoin.io) forever.

When minting a CryptoCocks token, we store on-chain your balance
(or more specifically, the fee of 1% of your wallet balance) in an
[Order Statistics Tree](https://en.wikipedia.org/wiki/Order_statistic_tree) in order to be able to efficiently find the rank of this balance, i.e. its index in a sorted list of balances of all minters.
We calculate the [Percentile Rank (PR)](https://en.wikipedia.org/wiki/Percentile_rank), i.e., the percentage of
balances in its frequency distribution that are less than the minter's current wallet balance.
We bin the continuous PRs (e.g. 33% or 99%) uniformly into 10 intervals such that
all bins have nearly identical widths. We map these 10 intervals (decentiles) to the 10 cock lengths, so that PRs in [0,10) are mapped to cock length 1, PRs in [20,30) are mapped to cock length 2, ..., PRs in [90,100) are mapped to cock length 10. Only the largest balance at the point in time of the mint will receive a special length, namely 11, which persists this information on the blockchain (i.e., see token URI and linked metadata fields).

In other words, this means that someone's cock will be as short as possible (length 1 of 10) if that minter's balance at the time of minting is no greater or equal to 10% of all the balances of the previous minters. 90% of previous minters have made a larger investment to obtain a CryptoCock.

This repository contains the solidity contracts powering CryptoCocks.

# Gallery
<p float="left">
  <img src="https://www.cryptococks.xyz/landing/cock-gallery/10.png" width="200" alt="CryptoCock 1" />
  <img src="https://www.cryptococks.xyz/landing/cock-gallery/08.png" width="200" alt="CryptoCock 2" />
  <img src="https://www.cryptococks.xyz/landing/cock-gallery/11.png" width="200" alt="CryptoCock 3" />
  <img src="https://www.cryptococks.xyz/landing/cock-gallery/14.png" width="200" alt="CryptoCock 4" />
  <img src="https://www.cryptococks.xyz/landing/cock-gallery/05.png" width="200" alt="CryptoCock 5" />
  <img src="https://www.cryptococks.xyz/landing/cock-gallery/24.png" width="200" alt="CryptoCock 6" />
  <img src="https://www.cryptococks.xyz/landing/cock-gallery/06.png" width="200" alt="CryptoCock 7" />
  <img src="https://www.cryptococks.xyz/landing/cock-gallery/03.png" width="200" alt="CryptoCock 8" />
  <img src="https://www.cryptococks.xyz/landing/cock-gallery/09.png" width="200" alt="CryptoCock 9" />
  <img src="https://www.cryptococks.xyz/cocks/100/20/cock.png" width="200" alt="CryptoCock 10" />
  <img src="https://www.cryptococks.xyz/cocks/20/20/cock.png" width="200" alt="CryptoCock 11" />
  <img src="https://www.cryptococks.xyz/cocks/40/18/cock.png" width="200" alt="CryptoCock 12" />
</p>


# Commands
## Deploy
```shell
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
```

## Tests
```shell
npm run test # run unit tests
npm run test:no-logs # run unit tests and hide contract console.log messages
npm run coverage # run unit tests with coverage report
npm run test:gas # run unit tests with gas usage report
```

## Static Analysis
> "Slither is a Solidity static analysis framework written in Python 3. It runs a suite of vulnerability detectors, prints visual information about contract details, and provides an API to easily write custom analyses. Slither enables developers to find vulnerabilities, enhance their code comprehension, and quickly prototype custom analyses." – [crytic/lither](https://github.com/crytic/slither)
```shell
pip3 install slither-analyzer # requires python 3.6+
slither . --filter-paths "hardhat|openzeppelin" # static contract analysis
```

## Linting
```shell
npm run check # contract checking (includes linting)
npm run lint # linting of typescript files
```

## Other
```shell
npx hardhat compile # compile contracts
npx hardhat clean
npx hardhat node
npx hardhat help
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

# Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.example file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL, e.g., from Alchemy, and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
npx hardhat run --network ropsten scripts/sample-script.ts
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```

# Performance optimizations

For faster runs of your tests and scripts, consider skipping ts-node's type checking by setting the environment variable `TS_NODE_TRANSPILE_ONLY` to `1` in hardhat's environment. For more details see [the documentation](https://hardhat.org/guides/typescript.html#performance-optimizations).
