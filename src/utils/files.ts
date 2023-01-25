import type { DappsFile, Contracts, DappsFileMinified } from "../typings/types";
import path from "path";
import config from "../../config";
import { listFilesFromDirectory } from "./github";

const BLOCK_WALLET_LOGO_PREFIX =
  "raw.githubusercontent.com/block-wallet/assets/master";
const BLOCK_WALLET_DAPPS_ASSETS =
  "https://github.com/block-wallet/assets/tree/master/dapps/";

export function getFilePath(...paths: string[]): string {
  return path.resolve(config.PROJECT_DIR, ...paths);
}

export function joinContractAddresses(
  ca1: Contracts,
  ca2: Contracts
): Contracts {
  return Object.entries(ca2).reduce((acc, [chainId, addresses]) => {
    if (acc[chainId]) {
      return {
        ...acc,
        [chainId]: Array.from(new Set<string>([...acc[chainId], ...addresses])),
      };
    }
    return {
      ...acc,
      [chainId]: addresses,
    };
  }, ca1);
}

export function joinFiles(spendersFiles: DappsFile[]): DappsFile {
  if (spendersFiles.length === 0) {
    return {};
  }
  if (spendersFiles.length === 1) {
    return spendersFiles[0];
  }

  const baseFile = spendersFiles[0];
  for (let i = 1; i < spendersFiles.length; i++) {
    const currentFile = spendersFiles[i];
    Object.keys(currentFile).forEach((spenderKey) => {
      if (!baseFile[spenderKey]) {
        baseFile[spenderKey] = currentFile[spenderKey];
      } else {
        baseFile[spenderKey] = {
          ...baseFile[spenderKey],
          logoURI:
            baseFile[spenderKey].logoURI || currentFile[spenderKey].logoURI,
          websiteURL:
            baseFile[spenderKey].websiteURL ||
            currentFile[spenderKey].websiteURL,
          contractAddresses: joinContractAddresses(
            baseFile[spenderKey].contractAddresses,
            currentFile[spenderKey].contractAddresses
          ),
        };
      }
    });
  }
  console.log(baseFile);
  return baseFile;
}

export function minify(spendersFile: DappsFile): DappsFileMinified {
  return Object.entries(spendersFile).reduce((acc, [spender, data]) => {
    return {
      ...acc,
      [spender]: {
        n: data.name,
        ca: data.contractAddresses,
      },
    };
  }, {} as DappsFileMinified);
}

function inferLogoFromHostname(hostname: string, files: string[]): string {
  return (
    files.find((fileName) => {
      return fileName.split("/")[1].match(hostname);
    }) || ""
  );
}

export async function enrichDappsFile(
  dappsFile: DappsFile
): Promise<DappsFile> {
  const enrichedFile: DappsFile = {};
  const dappsLogos = (
    await listFilesFromDirectory(new URL(BLOCK_WALLET_DAPPS_ASSETS), false)
  ).map((file) => file.path);
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
      }
    }

    enrichedFile[dapp] = {
      ...dappData,
      logoURI,
    };
  }
  return enrichedFile;
}
