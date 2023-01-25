import { generate as generateRevokeCash } from "./data-sources/revoke-cash";
import { generate as generateEthereumList } from "./data-sources/ethereum-lists";
import fs from "fs";
import { enrichDappsFile, getFilePath, joinFiles } from "./utils/files";
import { getCachedContracts } from "./utils/cache";
import type { DappsFile } from "./typings/types";
import { DAPPS_FILE_NAME, KNOWN_DAPPS_FILE_NAME } from "./utils/constants";
import { generateFolders } from "./generate-folders";
import config from "../config";

function delimitedConsoleLog(message: string) {
  console.log(
    `############################ ${message} ############################`
  );
}

function getKnownDappsFilePath(): string {
  return getFilePath(`./${KNOWN_DAPPS_FILE_NAME}.json`);
}

function getDappsFilePath(): string {
  return getFilePath(`./${DAPPS_FILE_NAME}.json`);
}

async function build() {
  delimitedConsoleLog("START");
  console.log("\n\n");

  let knownDappsFile: DappsFile = {};
  let oldDappsFile: DappsFile = {};
  if (fs.existsSync(getDappsFilePath())) {
    const file = fs.readFileSync(getDappsFilePath(), "utf-8");
    oldDappsFile = JSON.parse(file || "{}");
  }

  if (fs.existsSync(getKnownDappsFilePath())) {
    const file = fs.readFileSync(getKnownDappsFilePath(), "utf-8");
    knownDappsFile = JSON.parse(file || "{}");
  }

  console.log("1. Generating cache: \n");
  const cachedContracts = getCachedContracts(oldDappsFile);
  console.log(
    `Generated cached contracts of type ${cachedContracts.name} \n\n`
  );

  console.log(`2. Processing data-sources`);

  console.log(`2.1. ethereum-lists contracts: \n`);

  const ethList = await generateEthereumList(cachedContracts);

  console.log(
    `Process ended for ethereum-lists. New dapps ${
      Object.keys(ethList).length
    }\n\n`
  );

  console.log(`2.2. revoke.cash contracts: \n`);
  const revokeCash = await generateRevokeCash(cachedContracts);

  console.log(
    `Process ended for revoke.cash. New dapps ${
      Object.keys(revokeCash).length
    }\n\n`
  );

  const updatedDappsFile = await enrichDappsFile(
    joinFiles([knownDappsFile, oldDappsFile, revokeCash, ethList])
  );

  if (config.WRITE_FINAL_CONTRACTS_FILE) {
    console.log(`3. Writing dapps file... \n`);
    fs.writeFileSync(
      getDappsFilePath(),
      JSON.stringify(updatedDappsFile, null, 2)
    );
    console.log(`Dapps file written\n\n`);
  }

  if (config.GENERATE_CONTRACTS_FOLDER) {
    console.log(`3. Generating contracts folder... \n`);
    generateFolders(updatedDappsFile);
    console.log(`Contracts folder updated\n\n`);
  }

  delimitedConsoleLog("FINISHED");
}

build();
