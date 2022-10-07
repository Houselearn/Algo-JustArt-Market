import React, { useEffect } from 'react';
import logo from 'lib/assets/logo.svg';
import { useAlgoWeb3Context } from 'lib/utils/algoweb3';
import { connectWallet, fetchBalance } from 'lib/utils/wallet';
import { Fragment } from 'react';
import { Wallet } from 'components';
import Link from 'next/link';

export function Header() {

  const { state: { address, name, balance }, setAccount, updateBalance } = useAlgoWeb3Context()

  async function login() {
    try {
      const data = await connectWallet()
      setAccount(data)
      getBalance(data.address)
    } catch (e) {
      console.log(e)
    }
  }

  async function getBalance(address: string) {
    const balance = await fetchBalance(address)
    updateBalance(balance)
  }

  function disconnect() {
    setAccount({ address: "", name: "" })
  }

  useEffect(() => {
    if (address) {
      getBalance(address)
    }
  }, [address])

  return (
    <div className="bg-gray-900 border-b border-gray-800 text-white text-sm font-mono">
      <div className="container py-4 md:flex items-center">
        <div className="flex-1 mb-3 md:mb-0">
          <a href="/">
            <img src={logo.src} className={"filter"} style={{ height: 22 }} />
            <h6>justArt Market</h6>
          </a>
        </div>
        <div className="flex space-x-6 items-center">
          {address ? (
            <Fragment>
              <Link href="/create">
                <a>Create</a>
              </Link>
              <Link href="/my-items">
                <a>My Items</a>
              </Link>
              <Wallet
                address={address}
                name={name}
                amount={balance}
                symbol="ALGO"
                destroy={disconnect}
              />
            </Fragment>
          ) : (
            <a onClick={login} className="border border-red-500 px-3 py-2">Connect Wallet</a>
          )}
        </div>
      </div>
    </div>
  )
}