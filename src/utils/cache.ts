import type { DappsFile } from "../typings/types";
import fs from "fs";
import config from "../../config";
import path from "path";
export interface ContractsCache {
  name: string;
  isCached(chainId: number, contractAddress: string): boolean;
}

export class FileContractsCache
  extends Map<number, string[]>
  implements ContractsCache
{
  public readonly name = "FileContractsCache";

  public isCached(chainId: number, contractAddress: string): boolean {
    const chainContracts = this.get(chainId) || [];
    return chainContracts.includes(contractAddress.toLowerCase());
  }

  public addEntries(chainId: number, contractAddresses: string[]): void {
    const previousContracts = this.get(chainId) || [];
    this.set(
      chainId,
      previousContracts.concat(contractAddresses.map((c) => c.toLowerCase()))
    );
  }
}

export class FolderContractsCache implements ContractsCache {
  public readonly name = "FolderContractsCache";

  public isCached(chainId: number, contractAddress: string): boolean {
    const filePath = path.resolve(
      config.PROJECT_DIR,
      config.CONTRACTS_DIR,
      chainId.toString(),
      contractAddress
    );
    const isFileCached = fs.existsSync(`${filePath}.json`);
    return isFileCached;
  }
}

/**
 * Returns a list of already processed contracts indexed by chain-id
 */
export function getCachedContracts(spendersFile: DappsFile): ContractsCache {
  if (!spendersFile || Object.keys(spendersFile).length === 0) {
    return new FolderContractsCache();
  }

  const cachedContracts = new FileContractsCache();
  Object.values(spendersFile).forEach((spenderData) => {
    Object.entries(spenderData.contractAddresses).forEach(
      ([strChainId, contracts]) => {
        const chainId = Number(strChainId);
        cachedContracts.addEntries(chainId, contracts);
      }
    );
  });

  return cachedContracts;
}
