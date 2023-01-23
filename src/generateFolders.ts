import fs from "fs";
import type { DappsFile } from "src/typings/types";
import path from "path";
import { getFilePath } from "./utils/fileUtils";
import { DAPPS_FILE_NAME } from "./utils/constants";
import { listFilesFromDirectory } from "./githubDownloader";
const DAPP_CONTRACTS_PREFIX = "contracts";

const BLOCK_WALLET_LOGO_PREFIX =
  "raw.githubusercontent.com/block-wallet/assets/master";
const BLOCK_WALLET_DAPPS_ASSETS =
  "https://github.com/block-wallet/assets/tree/master/dapps/";

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

function inferLogoFromHostname(hostname: string, files: string[]): string {
  return files.find((fileName) => fileName.match(hostname)) || "";
}

export async function generateFolders(dappsFile: DappsFile) {
  const dappsLogos = (
    await listFilesFromDirectory(new URL(BLOCK_WALLET_DAPPS_ASSETS), false)
  ).map((file) => file.path);
  console.log(dappsLogos);
  for (const dapp in dappsFile) {
    const dappData = dappsFile[dapp];
    let logoURI = dappData.logoURI;
    if (!logoURI && dappData.websiteURL) {
      const inferredLogo = inferLogoFromHostname(
        new URL(dappData.websiteURL).hostname,
        dappsLogos
      );
      if (inferredLogo) {
        logoURI = `${BLOCK_WALLET_LOGO_PREFIX}/${inferredLogo}`;
        console.log(inferredLogo, dapp);
      }
    }
    for (const strChainId in dappData.contractAddresses) {
      for (const contract of dappData.contractAddresses[strChainId]) {
        const filePath = generatePath(strChainId, contract);
        ensureDirectoryExistence(filePath);
        fs.writeFileSync(
          filePath,
          JSON.stringify(
            {
              name: dappData.name,
              logoURI,
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
