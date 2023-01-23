import { generate as generateRevokeCash } from "./revokecash";
import { generate as generateEthereumList } from "./ethereumlist";
import fs from "fs";
import { getFilePath, joinFiles } from "./utils/fileUtils";
import { getCachedContracts } from "./utils/cache";
import type { DappsFile } from "./typings/types";
import { DAPPS_FILE_NAME, KNOWN_DAPPS_FILE_NAME } from "./utils/constants";
import { generateFolders } from "./generateFolders";

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
    `Generated cached contracts for chains ${cachedContracts.keysAsLog()} \n\n`
  );

  console.log(`2. Processing Ethereum list files: \n`);

  const ethList = await generateEthereumList(cachedContracts);

  console.log(
    `Process ended for ethereumlist. New dapps ${
      Object.keys(ethList).length
    }\n\n`
  );

  console.log(`3. Processing revoke.cash files: \n`);
  const revokeCash = await generateRevokeCash(cachedContracts);

  console.log(
    `Process ended for revoke.cash. New dapps ${
      Object.keys(revokeCash).length
    }\n\n`
  );

  const updatedDappsFile = joinFiles([
    knownDappsFile,
    oldDappsFile,
    revokeCash,
    ethList,
  ]);

  console.log(`4. Writing dapps file... \n`);
  fs.writeFileSync(
    getDappsFilePath(),
    JSON.stringify(updatedDappsFile, null, 2)
  );

  console.log(`Dapps file written\n\n`);

  console.log(`5. Generating contracts folder... \n`);

  generateFolders(updatedDappsFile);

  delimitedConsoleLog("FINISHED");
}

build();
