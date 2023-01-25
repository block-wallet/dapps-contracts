<br /> 
<p align="center">
  <a href="https://blockwallet.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/11839151/188500975-8cd95d07-c419-48aa-bb85-4200a6526f68.svg" />
      <source media="(prefers-color-scheme: light)" srcset="https://blockwallet.io/static/images/logo-blockwallet-black.svg" />
      <img src="[https://blockwallet.io/static/images/logo-medium.svg](https://user-images.githubusercontent.com/11839151/188500975-8cd95d07-c419-48aa-bb85-4200a6526f68.svg)" width="300" />
    </picture>
  </a>
</p>

<hr />

## BlockWallet - DApps Mapper

Generates a set of known contracts indexed by chain. Contracts are stored in the `/contracts/{chainId}` folder. The script uses two different data sources to gather contract addresses along with their identification. Data sources are:

- `revoke.cash` [dapps-contracts list](https://github.com/RevokeCash/revoke.cash/tree/master/public/dapp-contract-list)
- `ethereum-list` [contracts list](https://github.com/ethereum-lists/contracts) and their project identification

For getting websites images, we use the `blockwallet/assets` repository.

---

## How it works

The script executes several steps to get the work done:

### 0. Use the known-dapps

The process starts by checking whether it exists a file with custom dapps information. Is important to note that all the information collected will be joined with this file. In case of having the same dapp, it will join the information, prioritizing this file data.

### 1. Generating cache

To avoid re-processing files and execute multiple HTTP request, the script makes the best effort to generate a consistent cache from previous executions. There are two ways of generating caches:

- Using the `generated-dapps.json` file with all the contracts generated in a previous execution [NOT_RECOMMENDED].
- Using the `contracts` folder.

Is important to understand that every contract that is cached will not be re-processed. If you want to re-process it, either remove it from the `contracts` folder or from the `generated-dapps.json` file.

### 2. Fetch from data sources

We use two different data-sources that gathers the contracts along with their owner information. As you may have seen at the beginig of this guide, we suggest to download the data-sources repositories so that we can attempt fetching the contracts from a local folder and avoid executing too many HTTP requests.

#### 2.1 revoke.cash

This data-source provides an small set of contracts with their owner name. There is no way to identify the owner website or logo.

#### 2.2 ethereum-list

This data-source provides an big set of contracts with their project name. Once collected these contracts, we try to fetch more information about the project using the `projects` folder in the `ethereum-lists` repository. This extended information may have the dapp website and name.

### 3. Enrich dapps

Once the contracts are collected and grouped by dapp name, the process try to infer the dapp logo (if empty) from its website. By using the [`block-wallet/assets/dapps`](https://github.com/block-wallet/assets/tree/master/dapps/) repository folder, it tries to match the websiteURL with the asset name to infer the logo.

### 4. Generate output

Based on the configuration (`config.ts` file at the project root), this process will generate different outputs:

- `generated-dapps.json` file.
- `contracts` folder and subfolders indexed by chainId.

---

## Setup

This project needs to use node version `18.13.0` or above.

#### Automatic setup

- Execute the following script: `./setup.sh`

#### Manual setup

- `nvm use` to use correct node version
- `yarn` to install dependencies
- [Optional]: `git clone git@github.com:ethereum-lists/contracts.git ethereum-lists` to clone ethereum-list repostitory and avoid doing too many request.
- [Optional]: `git clone git@github.com:RevokeCash/revoke.cash.git revoke-cash` to clone revoke-cash repostitory and avoid doing too many request.

## Execute

The output of this script can be specified in the `config.ts` file at the root of this project.

Execute `yarn run generate` to run this process.
