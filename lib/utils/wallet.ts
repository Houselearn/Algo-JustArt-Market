import { initialise } from "./market";

export async function connectWallet() {
    try {
        let { myAlgoConnect } = await initialise()
        const accounts = await myAlgoConnect.connect()
        const account = accounts[0];
        return { address: account.address || "", name: account.name || "", }
    } catch (error) {
        console.log(error)
    }
}

export async function fetchBalance(accountAddress: string) {
    try {
        let { indexerClient } = await initialise()
        const response = await indexerClient.lookupAccountByID(accountAddress).do()
        const balance: number = response.account.amount;
        return { balance: balance || 0 };
    } catch (error) {
        console.log(error)
    }
};

