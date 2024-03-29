import { ContractsCache } from "../utils/cache";
import type { DappsFile } from "../typings/types";
import { downloadAllDirectoryFilesFromURL } from "../utils/github";
import { dappNameToKey } from "../utils/utils";
import path from "path";
import config from "../../config";

interface RevokeCashFileContent {
  name: string;
  label: string;
}

const REVOKE_CASH_URL =
  "https://github.com/RevokeCash/whois/tree/main/data/generated/spenders";

function decodePath(path: string): {
  chainId: number;
  contractAddress: string;
} {
  const [, , , chainId, fileName] = path.split("/");
  return {
    chainId: Number(chainId),
    contractAddress: fileName.split(".")[0],
  };
}

export async function generate(
  contractsCache: ContractsCache
): Promise<DappsFile> {
  const files = await downloadAllDirectoryFilesFromURL(
    new URL(REVOKE_CASH_URL),
    {
      isCached(filePath: string) {
        const { chainId, contractAddress } = decodePath(filePath);
        return contractsCache.isCached(chainId, contractAddress);
      },
      attempLocal: true,
      localBasePath: path.resolve(
        config.PROJECT_DIR,
        config.REVOKE_CASH_LOCAL_PATH
      ),
      localFolderPath: "data/generated/spenders",
    }
  );
  const spendersFile: DappsFile = {};
  for (const path of files.keys()) {
    const { chainId, contractAddress } = decodePath(path);
    const fileContent = files.get(path) as RevokeCashFileContent;
    const spenderKey = dappNameToKey(fileContent.name);
    if (!spendersFile[spenderKey]) {
      spendersFile[spenderKey] = {
        contractAddresses: {
          [chainId]: [],
        },
        logoURI: "",
        websiteURL: "",
        name: fileContent.name,
      };
    }
    const chainContracts =
      spendersFile[spenderKey].contractAddresses[chainId] || [];
    spendersFile[spenderKey].contractAddresses[chainId] = [
      ...chainContracts,
      contractAddress,
    ];
  }
  return spendersFile;
}
