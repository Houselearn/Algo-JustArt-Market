export const config = {
    algodToken: "",
    algodServer: "https://node.testnet.algoexplorerapi.io",
    algodPort: "",
    indexerToken: "",
    indexerServer: "https://algoindexer.testnet.algoexplorerapi.io",
    indexerPort: "",
}

export const minRound = 21540981;

// https://github.com/algorandfoundation/ARCs/blob/main/ARCs/arc-0002.md
export const marketplaceNote = "justArt-market:uv0001"

// Maximum local storage allocation, immutable
export const numLocalInts = 0;
export const numLocalBytes = 0;
// Maximum global storage allocation, immutable
export const numGlobalInts = 3; // Global variables stored as Int: last price, current price, item listed
export const numGlobalBytes = 5; // Global variables stored as Bytes: name, description, image, location, current owner, last owner

export const ALGORAND_DECIMALS = 6;