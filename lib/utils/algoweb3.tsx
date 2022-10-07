import React, { createContext, useContext, useMemo, useReducer, useEffect } from "react"

interface State {
    address: string;
    name: string;
    balance: number;
}

const INITIAL_STATE: State = {
    address: "",
    name: "",
    balance: 0,

}

const SET_ACCOUNT = "SET_ACCOUNT"

const UPDATE_BALANCE = "UPDATE_BALANCE"

interface SetAccount {
    type: "SET_ACCOUNT";
    data: {
        address: string;
        name: string;
    }
}

interface UpdateBalance {
    type: "UPDATE_BALANCE";
    data: {
        balance: number
    }
}

type Action = SetAccount | UpdateBalance;


function reducer(state: State = INITIAL_STATE, action: Action) {
    switch (action.type) {
        case SET_ACCOUNT: {
            return {
                ...state,
                address: action.data.address,
                name: action.data.name
            }
        }
        case UPDATE_BALANCE: {
            return {
                ...state,
                balance: action.data.balance
            }
        }
        default:
            return state
    }
}

interface SetAccountInputs {
    address: string;
    name: string;
}

interface UpdateBalanceInputs {
    balance: number;
}

const AlgoWeb3Context = createContext({
    state: INITIAL_STATE,
    setAccount: (_data: SetAccountInputs) => { },
    updateBalance: (_data: UpdateBalanceInputs) => { },
})

export function useAlgoWeb3Context() {
    return useContext(AlgoWeb3Context)
}

interface ProviderProps { }

export const AlgoProvider: React.FC<ProviderProps> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

    function setAccount(data: SetAccountInputs) {
        dispatch({
            type: SET_ACCOUNT,
            data,
        });
    }

    function updateBalance(data: UpdateBalanceInputs) {
        dispatch({
            type: UPDATE_BALANCE,
            data,
        })
    }

    useEffect(() => {
        //checking if there already is a state in localstorage
        //if yes, update the current state with the stored one  
        if (JSON.parse(localStorage.getItem("account"))) {

            let data: SetAccountInputs = JSON.parse(localStorage.getItem("account"))

            setAccount(data)
        }

    }, []);

    useEffect(() => {
        if (state !== INITIAL_STATE) {
            // create and / or set a new localstorage
            let account = { address: state.address, name: state.name }
            localStorage.setItem("account", JSON.stringify(account));

        }
    }, [state])

    return (
        <AlgoWeb3Context.Provider
            value={useMemo(() => ({
                state,
                setAccount,
                updateBalance,
            }),
                [state]
            )}
        >
            {children}
        </AlgoWeb3Context.Provider>
    )
}