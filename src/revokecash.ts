import { ContractsCache } from "./utils/cache";
import type { DappsFile } from "./typings/types";
import { downloadAllDirectoryFilesFromURL } from "./githubDownloader";
import { spenderNameToKey } from "./utils/utils";

interface RevokeCashFileContent {
  appName: string;
  label: string;
}

const REVOKE_CASH_URL =
  "https://github.com/RevokeCash/revoke.cash/tree/master/public/dapp-contract-list";

function decodePath(path: string): {
  chainId: number;
  contractAddress: string;
} {
  const [, , chainId, fileName] = path.split("/");
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
    }
  );
  const spendersFile: DappsFile = {};
  for (const path of files.keys()) {
    const { chainId, contractAddress } = decodePath(path);
    const fileContent = files.get(path) as RevokeCashFileContent;
    const spenderKey = spenderNameToKey(fileContent.appName);
    if (!spendersFile[spenderKey]) {
      spendersFile[spenderKey] = {
        contractAddresses: {
          [chainId]: [],
        },
        logoURI: "",
        websiteURL: "",
        name: fileContent.appName,
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
