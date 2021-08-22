declare global {
    namespace NodeJS {
      interface ProcessEnv {
        CHAIN: string;
        CHAINID: string;
        PROVIDER: string;
        FORKING: string;
        PROVIDER_FORKING: string;
        MNEMONIC: string;
        PRIVATE_KEY: string;
        ETHERSCAN: string;
        BLOCKNUMBER: string;
        GAS: string;
        GAS_PRICE: string;
        GAS_MULTIPLIER: string;
        HD_PATH: string;
        HD_INITIAL: string;
        HD_COUNT: string;
        TENDERLY_PROJECT: string;
        TENDERLY_USERNAME: string;
      }
    }
  }

  // convert file into a module by adding an empty export statement.
  export {}
