import React, { useState, useCallback, useEffect } from "react";
import { Layout, Loader } from "components";
import { ItemList } from "components/item-list/item-list";
import { getUserItems } from "lib/utils/market";
import { useAlgoWeb3Context } from "lib/utils/algoweb3";

function MyListings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const { state: { address } } = useAlgoWeb3Context();

  // function to get the list of items
  const retrieveItems = useCallback(async () => {
    try {
      setLoading(true);
      const userItems = await getUserItems(address);
      setItems(userItems);
    } catch (error) {
      console.log({ error });
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (address !== null) {
      retrieveItems();
    }
  }, [retrieveItems, address])

  return (
    <Layout>
      <div className="container py-12">
        <h1 className="font-semibold text-xl mb-5">My Items</h1>
        {loading && <Loader />}
        <ItemList items={items} />
      </div>
    </Layout>
  )
}

export default MyListings;