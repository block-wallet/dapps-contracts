declare module "list-github-dir-content";

export type Contracts = {
  [chainId: number]: string[];
};

export interface DappsFile {
  [dappKey: string]: {
    name: string;
    logoURI: string;
    websiteURL: string;
    contractAddresses: Contracts;
  };
}

export interface DappsFileMinified {
  [dappKey: string]: {
    n: string;
    ca: Contracts;
  };
}
