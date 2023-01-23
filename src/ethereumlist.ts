import { ContractsCache } from "./utils/cache";
import type { DappsFile } from "./typings/types";
import {
  downloadAllDirectoryFilesFromURL,
  fetchPublicFile,
  listFilesFromDirectory,
} from "./githubDownloader";
import { spenderNameToKey } from "./utils/utils";
import config from "../config";
import path from "path";

interface EthereumListContractFileContent {
  project: string;
  name: string;
  source: string;
}

interface EthereumListProjectFileContent {
  name: string;
  website: string;
}

const ETHEREUMLIST_CONTRACTS_URL =
  "https://github.com/ethereum-lists/contracts/tree/main/contracts";

const ETHEREUMLIST_PROJECTS_URL =
  "https://github.com/ethereum-lists/contracts/tree/main/projects";

//Decodes path of the shape: something/something/chainId/contract.json
export function decodePath(path: string): {
  chainId: number;
  contractAddress: string;
} {
  const [, chainId, fileName] = path.split("/");
  return {
    chainId: Number(chainId),
    contractAddress: fileName.split(".")[0],
  };
}

export async function generate(
  contractsCache: ContractsCache
): Promise<DappsFile> {
  const files =
    await downloadAllDirectoryFilesFromURL<EthereumListContractFileContent>(
      new URL(ETHEREUMLIST_CONTRACTS_URL),
      {
        concurrency: 1000,
        isCached(filePath: string) {
          const { chainId, contractAddress } = decodePath(filePath);
          return contractsCache.isCached(chainId, contractAddress);
        },
        attempLocal: true,
        localBasePath: path.resolve(
          config.PROJECT_DIR,
          "ethereum-lists",
          "contracts"
        ),
      }
    );

  const spendersFile: DappsFile = {};
  if (files.size > 0) {
    const projectsFiles = (
      await listFilesFromDirectory(new URL(ETHEREUMLIST_PROJECTS_URL), false)
    ).map((file) => file.path);

    console.log("Ethereum list project list", projectsFiles);

    const fileCache: Record<string, EthereumListProjectFileContent> = {};

    for (const path of files.keys()) {
      const { chainId, contractAddress } = decodePath(path);
      const fileContent = files.get(path);
      if (fileContent?.project) {
        let projectData: EthereumListProjectFileContent | undefined;
        const fileName = projectsFiles.find((projectFile) =>
          projectFile.match(fileContent.project)
        );

        if (fileName) {
          try {
            if (fileCache[fileName]) {
              projectData = fileCache[fileName];
            } else {
              projectData =
                await fetchPublicFile<EthereumListProjectFileContent>(
                  new URL(ETHEREUMLIST_PROJECTS_URL),
                  fileName
                );
              fileCache[fileName] = projectData;
            }
          } catch (e) {
            console.warn("Error fetching project details", fileName, e);
          }
        }

        const spenderKey = spenderNameToKey(fileContent.project);
        if (!spendersFile[spenderKey]) {
          spendersFile[spenderKey] = {
            contractAddresses: {
              [chainId]: [],
            },
            logoURI: "",
            websiteURL: projectData?.website || "",
            name: projectData?.name || fileContent.project,
          };
        }

        const chainContracts =
          spendersFile[spenderKey].contractAddresses[chainId] || [];
        spendersFile[spenderKey].contractAddresses[chainId] = [
          ...chainContracts,
          contractAddress,
        ];
      }
    }
  }

  return spendersFile;
}
