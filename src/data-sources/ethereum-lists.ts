import { ContractsCache } from "../utils/cache";
import type { DappsFile } from "../typings/types";
import {
  downloadAllDirectoryFilesFromURL,
  fetchPublicFile,
  listFilesFromDirectory,
} from "../utils/github";
import { dappNameToKey } from "../utils/utils";
import config from "../../config";
import path from "path";

interface EthereumListContractFileContent {
  project: string;
  name: string;
  source: string;
}

interface EthereumListProjectFileContent {
  name: string;
  website?: string;
}

const ETHEREUMLIST_CONTRACTS_URL =
  "https://github.com/ethereum-lists/contracts/tree/main/contracts";

const ETHEREUMLIST_PROJECTS_URL =
  "https://github.com/ethereum-lists/contracts/tree/main/projects";

const VERSION_REGEX = /_?v\d/gim;

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

function toProjectFilePath(fileName: string) {
  return `projects/${fileName}.json`;
}

function isVersioned(name: string): boolean {
  //regex checks that the file name contains a "v1,v2...vn"
  return name.match(VERSION_REGEX) !== null;
}

function removeVersionFromName(nameWithVersion: string): string {
  return nameWithVersion.replaceAll(VERSION_REGEX, "");
}

function joinVersionedProjects(
  projectFiles: Map<string, EthereumListProjectFileContent>
): Map<string, EthereumListProjectFileContent> {
  const joinedVersionedFiles: Map<string, EthereumListProjectFileContent> =
    new Map(projectFiles);
  for (const filePath of joinedVersionedFiles.keys()) {
    const pathSplitted = filePath.split("/");
    const projectName = pathSplitted[pathSplitted.length - 1];
    let projectWithoutVersionContent:
      | EthereumListProjectFileContent
      | undefined;
    if (isVersioned(projectName)) {
      const projectWithoutVersion = removeVersionFromName(projectName);
      pathSplitted[pathSplitted.length - 1] = projectWithoutVersion;
      const projectWithoutVersionPath = pathSplitted.join("/");
      projectWithoutVersionContent = joinedVersionedFiles.get(
        projectWithoutVersionPath
      );
    }
    const versionedFile = joinedVersionedFiles.get(filePath);
    if (versionedFile) {
      joinedVersionedFiles.set(filePath, {
        name: versionedFile.name,
        website:
          versionedFile?.website || projectWithoutVersionContent?.website,
      });
    }
  }
  return joinedVersionedFiles;
}

export async function generate(
  contractsCache: ContractsCache
): Promise<DappsFile> {
  const files =
    await downloadAllDirectoryFilesFromURL<EthereumListContractFileContent>(
      new URL(ETHEREUMLIST_CONTRACTS_URL),
      {
        isCached(filePath: string) {
          const { chainId, contractAddress } = decodePath(filePath);
          return contractsCache.isCached(chainId, contractAddress);
        },
        concurrency: 1000,
        attempLocal: true,
        localBasePath: path.resolve(
          config.PROJECT_DIR,
          config.ETHEREUM_LIST_LOCAL_PATH
        ),
        localFolderPath: "contracts",
      }
    );

  const spendersFile: DappsFile = {};
  if (files.size > 0) {
    const projectFiles = joinVersionedProjects(
      await downloadAllDirectoryFilesFromURL<EthereumListProjectFileContent>(
        new URL(ETHEREUMLIST_PROJECTS_URL),
        {
          recursive: false,
          attempLocal: true,
          localBasePath: path.resolve(
            config.PROJECT_DIR,
            config.ETHEREUM_LIST_LOCAL_PATH
          ),
          localFolderPath: "projects",
        }
      )
    );

    for (const path of files.keys()) {
      const { chainId, contractAddress } = decodePath(path);
      const fileContent = files.get(path);
      if (fileContent?.project) {
        const projectData = projectFiles.get(
          toProjectFilePath(fileContent.project)
        );

        const spenderKey = dappNameToKey(fileContent.project);
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
