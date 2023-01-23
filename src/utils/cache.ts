import type { DappsFile } from "../typings/types";

export class ContractsCache extends Map<number, string[]> {
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

  public keysAsLog() {
    return [...this.keys()];
  }
}

/**
 * Returns a list of already processed contracts indexed by chainId
 */
export function getCachedContracts(spendersFile: DappsFile): ContractsCache {
  const cachedContracts = new ContractsCache();

  if (!spendersFile) {
    console.log("No file");
    return cachedContracts;
  }

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
