import fs from "fs";
import type { DappsFile } from "src/typings/types";
import path from "path";
const DAPP_CONTRACTS_PREFIX = "contracts";

function generateDirectoryPath(chainId: string): string {
  return `${DAPP_CONTRACTS_PREFIX}/${chainId}`;
}

function generatePath(chainId: string, contractAddress: string): string {
  return `${generateDirectoryPath(chainId)}/${contractAddress}.json`;
}

function ensureDirectoryExistence(filePath: string) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

export async function generateFolders(dappsFile: DappsFile) {
  for (const dapp in dappsFile) {
    const dappData = dappsFile[dapp];
    for (const strChainId in dappData.contractAddresses) {
      for (const contract of dappData.contractAddresses[strChainId]) {
        const filePath = generatePath(strChainId, contract);
        ensureDirectoryExistence(filePath);
        fs.writeFileSync(
          filePath,
          JSON.stringify(
            {
              name: dappData.name,
              logoURI: dappData.logoURI,
              websiteURL: dappData.websiteURL,
            },
            null,
            2
          )
        );
      }
    }
  }
}
