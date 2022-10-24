import React, { Fragment, useCallback, useEffect, useState } from "react";
import { Button, Layout, Loader } from "components";
import { getItem } from "lib/utils/market";
import TimeAgo from "react-timeago";
import { ExternalLink } from "react-feather";
import { useAlgoWeb3Context } from "lib/utils/algoweb3";
import { unlistItem, buyItem } from "lib/utils/market";
import { connectWallet, fetchBalance } from 'lib/utils/wallet';
import { Item } from "lib/interfaces";
import ListItemModal from "./listModal";
import { microAlgosToString, truncateAddress } from "lib/utils/conversions";

function Details({ id }: { id: number }) {

  const template: Item = {
    appId: 0,
    appAddress: "",
    name: "",
    description: "",
    image: "",
    location: "",
    currPrice: 0,
    prevPrice: 0,
    currOwner: "",
    isItemListed: 0,
    history: []
  }

  const { state: { address }, setAccount, updateBalance } = useAlgoWeb3Context()
  const [item, setItem] = useState<Item>(template);
  const [loading, setLoading] = useState(false);
  const [pageLoad, setPageLoad] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleClose = () => setShowModal(false);

  function valueIsNaN(v: number) {
    return v !== v;
  }

  const getItemData = useCallback(async () => {
    if (id !== null && !valueIsNaN(id)) {
      try {
        setPageLoad(true);
        setItem(await getItem(id, true));
      } catch (error) {
        console.log({ error });
      } finally {
        setPageLoad(false);
      }
    }
  }, [address, id]);

  const buttonLabel = address ? (item.currOwner === address ? (item.isItemListed === 1 ? 'Remove listing' : 'Add listing') : 'Buy now') : 'Connect Wallet';

  async function getBalance(address: string) {
    const balance = await fetchBalance(address)
    updateBalance(balance)
  }

  async function connect() {
    try {
      const data = await connectWallet()
      setAccount(data)
      getBalance(data.address)
    } catch (e) {
      console.log(e)
    }
  }

  async function handleAction() {
    if (!address) {
      await connect();
      return;
    }
    setLoading(true);
    try {
      if (item.currOwner === address) {
        if (buttonLabel == "Add listing") {
          setShowModal(true);
        } else if (buttonLabel == "Remove listing") {
          await unlistItem(address, item);
          getItemData();
          getBalance(address);
        }
      } else {
        await buyItem(address, item);
        getItemData();
        getBalance(address);
      }
    } catch (e) { }
    setLoading(false);
  }

  useEffect(() => {
    if (id === null) {
      return () => { }
    }
    getItemData();
  }, [id, getItemData])
  return (
    <Layout>
      {pageLoad ? (
        <Loader />
      ) : (
        <div className="container py-8">
          <div className="md:grid md:grid-cols-3 md:gap-8">
            <div className="mb-8 md:mb-0">
              <div className="bg-gray-800 border border-gray-800 mb-8">
                <img src={item.image} className="w-full rounded-sm shadow-xl" />
              </div>
              <Fragment>
                <div className="bg-gray-800 border border-gray-700 rounded-sm grid grid-cols-2 divide-x divide-gray-700">
                  <div className="p-4 text-center">
                    <p className="uppercase font-bold text-sm mb-1 text-red-600">
                      Item Price
                    </p>
                    <p className="font-mono text-xl leading-none">
                      {microAlgosToString(item.currPrice)} ALGO
                    </p>
                  </div>
                  <div className="p-3 flex flex-col justify-center items-center">
                    <Button onClick={handleAction} loading={loading} block>{buttonLabel}</Button>
                  </div>
                </div>
              </Fragment>
            </div>
            <div className="md:col-span-2">
              <div className="bg-gray-800s lg:border-l border-gray-700 border-dashesd lg:pl-8 rounded-sm">
                <p className="text-lg font-medium">
                  <a>{item.name}</a>
                </p>
                <h1 className="text-4xl font-bold">{item.name}</h1>
                <p className="mb-8 w-full">
                  <span className="mr-1">Owned by</span>
                  <a
                    href={`https://testnet.algoexplorer.io/address/${item.currOwner}`}
                    target="_blank"
                    className="font-mono text-red-200 border-b border-dashed border-gray-700 truncate block">
                    {truncateAddress(item.currOwner)}
                  </a>
                </p>
                <h3 className="mb-3 font-semibold text-lg">Details</h3>
                <div className="mb-8 bg-gray-900 p-4 rounded-sm space-y-4">
                  <div>
                    <span className="font-bold text-sm block">Description</span>
                    {item.description}
                  </div>
                  <div>
                    <span className="font-bold text-sm block">Location</span>
                    {item.location}
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <span className="font-bold text-sm block">Item ID</span>
                      <a
                        href={`https://testnet.algoexplorer.io/application/${item.appId}`}
                        target="_blank"
                        className="font-mono text-red-200 border-b border-dashed border-gray-700 truncate block">
                        {item.appId}
                      </a>
                    </div>
                  </div>
                </div>
                <h3 className="mb-3 font-semibold text-lg">History</h3>
                <div className="bg-gray-900 rounded-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <td className="px-4 py-3">Type</td>
                        <td className="px-4 py-3">From</td>
                        <td className="text-right px-4 py-3">Price</td>
                        <td className="text-right px-4 py-3">Time</td>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      {item.history.reverse()?.map(transaction => (
                        <tr key={transaction.txHash}>
                          <td className="border-t border-gray-800 px-4 py-3">
                            <span className="flex items-center space-x-1">
                              <a href={`https://testnet.algoexplorer.io/tx/${transaction.txHash}`} target="_blank" className="flex items-center space-x-1">
                                <span>{(transaction.type.toUpperCase())}</span>
                                <ExternalLink size="0.85em" />
                              </a>
                            </span>
                          </td>
                          <td className="relative w-1/4 border-t border-gray-800">
                            <span className="absolute inset-0 truncate px-4 py-3">
                              {truncateAddress(transaction.from)}
                            </span>
                          </td>
                          <td className="relative w-1/4 border-t border-gray-800 px-4 py-3 text-right">
                            {Number(transaction.price) ? `${microAlgosToString(transaction.price)} ALGO` : '--'}
                          </td>
                          <td className="text-right border-t border-gray-800 px-4 py-3">
                            <TimeAgo date={new Date(transaction.createdAt * 1000)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal ? (
        <ListItemModal address={address} item={item} handleClose={handleClose} />
      ) :
        <></>
      }

    </Layout>
  )
}

export default Details;