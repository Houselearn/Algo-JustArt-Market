import algosdk from "algosdk";
import MyAlgoConnect from "@randlabs/myalgo-connect";
import {
    config,
    marketplaceNote,
    minRound,
    numGlobalBytes,
    numGlobalInts,
    numLocalBytes,
    numLocalInts,
} from "./constants";
/* eslint import/no-webpack-loader-syntax: off */
import approvalProgram from "!!raw-loader!../contracts/JustArt_Market_Item_approval.teal";
import clearProgram from "!!raw-loader!../contracts/JustArt_Market_Item_clear.teal";
import { Item, Transaction } from "lib/interfaces"
import { base64ToUTF8String, getAddress, utf8ToBase64String } from "./conversions";

export const initialise = async () => {
    const algodClient = new algosdk.Algodv2(config.algodToken, config.algodServer, config.algodPort)
    const indexerClient = new algosdk.Indexer(config.indexerToken, config.indexerServer, config.indexerPort);
    const myAlgoConnect = new MyAlgoConnect();
    return { algodClient, indexerClient, myAlgoConnect }
}

// Compile smart contract in .teal format to program
const compileProgram = async (programSource: any) => {
    let { algodClient } = await initialise()
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await algodClient.compile(programBytes).do();
    return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
};

// CREATE ITEM: ApplicationCreateTxn
export const addNewItem = async (senderAddress: string, item: Item) => {
    console.log("Adding Item...");
    let { algodClient, myAlgoConnect } = await initialise()
    let params = await algodClient.getTransactionParams().do();
    // Compile programs
    const compiledApprovalProgram = await compileProgram(approvalProgram);
    const compiledClearProgram = await compileProgram(clearProgram);

    // Build note to identify transaction later and required app args as Uint8Arrays
    let note = new TextEncoder().encode(marketplaceNote);
    let name = new TextEncoder().encode(item.name);
    let description = new TextEncoder().encode(item.description);
    let image = new TextEncoder().encode(item.image);
    let location = new TextEncoder().encode(item.location);
    let price = algosdk.encodeUint64(item.currPrice);

    let appArgs = [name, description, image, location, price];

    // Create ApplicationCreateTxn
    let txn = algosdk.makeApplicationCreateTxnFromObject({
        from: senderAddress,
        suggestedParams: params,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: compiledApprovalProgram,
        clearProgram: compiledClearProgram,
        numLocalInts: numLocalInts,
        numLocalByteSlices: numLocalBytes,
        numGlobalInts: numGlobalInts,
        numGlobalByteSlices: numGlobalBytes,
        note: note,
        appArgs: appArgs,
    });

    // Get transaction ID
    let txId = txn.txID().toString();

    // Sign & submit the transaction
    let signedTxn = await myAlgoConnect.signTransaction(txn.toByte());
    console.log("Signed transaction with txID: %s", txId);
    await algodClient.sendRawTransaction(signedTxn.blob).do();

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // Get the completed Transaction
    console.log(
        "Transaction " +
        txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );

    // Get created application id and notify about completion
    let transactionResponse = await algodClient
        .pendingTransactionInformation(txId)
        .do();
    let appId = transactionResponse["application-index"];
    console.log("Created new app-id: ", appId);
    return appId;
};

// BUY ITEM: Group transaction consisting of ApplicationCallTxn and PaymentTxn
export const buyItem = async (senderAddress: string, item: Item) => {
    console.log("Buying Item...");
    let { algodClient, myAlgoConnect } = await initialise()
    let params = await algodClient.getTransactionParams().do();

    // Build required app args as Uint8Array
    let buyArg = new TextEncoder().encode("buy");
    let appArgs = [buyArg];
    let accounts = [item.currOwner]

    // Create ApplicationCallTxn
    let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        from: senderAddress,
        appIndex: item.appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        suggestedParams: params,
        appArgs: appArgs,
        accounts: accounts
    });

    // Create PaymentTxn
    let paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddress,
        to: item.currOwner,
        amount: item.currPrice,
        suggestedParams: params,
    });

    let txnArray = [appCallTxn, paymentTxn];

    // Create group transaction out of previously build transactions
    let groupID = algosdk.computeGroupID(txnArray);
    for (let i = 0; i < 2; i++) txnArray[i].group = groupID;

    // Sign & submit the group transaction
    let signedTxn = await myAlgoConnect.signTransaction(
        txnArray.map((txn) => txn.toByte())
    );
    console.log("Signed group transaction");
    let tx = await algodClient
        .sendRawTransaction(signedTxn.map((txn) => txn.blob))
        .do();

    // Wait for group transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);

    // Notify about completion
    console.log(
        "Group transaction " +
        tx.txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );
};


// RELISTING ITEM:  ApplicationCallTxn
export const relistItem = async (senderAddress: string, item: Item, newLocation: string, newPrice: number) => {
    console.log("Relisting Item...");
    let { algodClient, myAlgoConnect } = await initialise()
    let params = await algodClient.getTransactionParams().do();

    // Build required app args as Uint8Array
    let relistArg = new TextEncoder().encode("relist");
    let location = new TextEncoder().encode(newLocation);
    let price = algosdk.encodeUint64(newPrice);
    let appArgs = [relistArg, location, price];

    // Create ApplicationCallTxn
    let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        from: senderAddress,
        appIndex: item.appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        suggestedParams: params,
        appArgs: appArgs,
    });

    // Get transaction ID
    let txId = appCallTxn.txID().toString();

    // Sign & submit the transaction
    let signedTxn = await myAlgoConnect.signTransaction(appCallTxn.toByte());
    console.log("Signed transaction with txID: %s", txId);
    await algodClient.sendRawTransaction(signedTxn.blob).do();

    // Wait for group transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // Notify about completion
    console.log(
        "Group transaction " +
        txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );
};

// UNLISTING ITEM:  ApplicationCallTxn
export const unlistItem = async (senderAddress: string, item: Item) => {
    console.log("Unlisting Item...");
    let { algodClient, myAlgoConnect } = await initialise()

    let params = await algodClient.getTransactionParams().do();

    // Build required app args as Uint8Array
    let unlistArg = new TextEncoder().encode("unlist");
    let appArgs = [unlistArg];

    // Create ApplicationCallTxn
    let appCallTxn = algosdk.makeApplicationCallTxnFromObject({
        from: senderAddress,
        appIndex: item.appId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        suggestedParams: params,
        appArgs: appArgs,
    });

    // Get transaction ID
    let txId = appCallTxn.txID().toString();

    // Sign & submit the transaction
    let signedTxn = await myAlgoConnect.signTransaction(appCallTxn.toByte());
    console.log("Signed transaction with txID: %s", txId);
    await algodClient.sendRawTransaction(signedTxn.blob).do();

    // Wait for group transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // Notify about completion
    console.log(
        "Group transaction " +
        txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );
};



// GET PRODUCTS: Use indexer
export const getItems = async () => {
    console.log("Fetching Items...");
    let { indexerClient } = await initialise()
    let note = new TextEncoder().encode(marketplaceNote);
    let encodedNote = Buffer.from(note).toString("base64");

    // Step 1: Get all transactions by notePrefix (+ minRound filter for performance)
    let transactionInfo = await indexerClient
        .searchForTransactions()
        .notePrefix(encodedNote)
        .txType("appl")
        .minRound(minRound)
        .do();

    let Items: Item[] = [];
    for (const transaction of transactionInfo.transactions) {
        let appId = transaction["created-application-index"];
        if (appId) {
            // Step 2: Get each application by application id
            let item = await getItem(appId, false);
            if (item) {
                Items.push(item);
            }
        }
    }
    console.log("Items fetched.");
    return Items;
};

export const getUserItems = async (senderAddress: string) => {
    let items = await getItems();

    let userItems: Item[] = []
    for (let item of items) {
        if (senderAddress !== item.currOwner) continue;

        userItems.push(item);
    }

    return userItems;
}

export const getItem = async (appId: number, getHistory: boolean) => {
    try {
        let { indexerClient } = await initialise()
        // 1. Get application by appId
        let response = await indexerClient
            .lookupApplications(appId)
            .includeAll(true)
            .do();
        if (response.application.deleted) {
            return null;
        }
        let globalState = response.application.params["global-state"];

        let appAddress = algosdk.getApplicationAddress(appId);

        let name = "";
        let description = "";
        let image = "";
        let location = "";
        let currPrice = 0;
        let prevPrice = 0;
        let currOwner = "";
        let isItemListed = 0;
        let history = [];

        if (getField("NAME", globalState) !== undefined) {
            let field = getField("NAME", globalState).value.bytes;
            name = base64ToUTF8String(field);
        }

        if (getField("IMAGE", globalState) !== undefined) {
            let field = getField("IMAGE", globalState).value.bytes;
            image = base64ToUTF8String(field);
        }

        if (getField("PRICE", globalState) !== undefined) {
            currPrice = getField("PRICE", globalState).value.uint;
        }

        if (getField("DESCRIPTION", globalState) !== undefined) {
            let field = getField("DESCRIPTION", globalState).value.bytes;
            description = base64ToUTF8String(field);
        }

        if (getField("LOCATION", globalState) !== undefined) {
            let field = getField("LOCATION", globalState).value.bytes;
            location = base64ToUTF8String(field);
        }

        if (getField("PREVPRICE", globalState) !== undefined) {
            prevPrice = getField("PREVPRICE", globalState).value.uint;
        }

        if (getField("OWNER", globalState) !== undefined) {
            let field = getField("OWNER", globalState).value.bytes;
            currOwner = getAddress(field);
        }

        if (getField("LISTED", globalState) !== undefined) {
            isItemListed = getField("LISTED", globalState).value.uint;
        }

        if (getHistory) {
            history = await getTransactionHistory(appId);
        }

        return {
            appId,
            appAddress,
            name,
            description,
            image,
            location,
            currPrice,
            prevPrice,
            currOwner,
            isItemListed,
            history
        }

    } catch (err) {
        return null;
    }
};


const getTransactionHistory = async (appId: number) => {
    let { indexerClient } = await initialise()
    let transactionInfo = await indexerClient
        .searchForTransactions()
        .applicationID(appId)
        .txType("appl")
        .do();
    let transactions: Transaction[] = []
    for (const tx of transactionInfo.transactions) {
        if (tx["application-transaction"]["on-completion"] === "noop") {
            let txHash: string = tx["id"];
            let from: string = tx["sender"];
            let createdAt: number = tx["round-time"];
            let type: string;
            let price: number;
            let globalState = tx["global-state-delta"];

            if (tx["application-transaction"]["application-id"] === 0) {
                type = "add";
            } else {
                type = base64ToUTF8String(
                    tx["application-transaction"]["application-args"][0]
                );
            }

            if (type === "buy") {
                if (getField("PREVPRICE", globalState) !== undefined) {
                    price = getField("PREVPRICE", globalState).value.uint;
                }
            } else {
                if (getField("PRICE", globalState) !== undefined) {
                    price = getField("PRICE", globalState).value.uint;
                }
            }
            transactions.push({ txHash, type, from, price, createdAt })
        }
    }

    return transactions;
}

const getField = (fieldName: string, State: any) => {
    return State.find((state: any) => {
        return state.key === utf8ToBase64String(fieldName);
    });
};