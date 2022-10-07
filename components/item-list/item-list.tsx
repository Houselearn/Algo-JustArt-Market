import React from "react"
import { ItemCard } from "components";
import { Item } from "lib/interfaces";

export function ItemList({ items }: { items: Item[] }) {
  if (items) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {items.map(item => <ItemCard item={item} key={item.appId} />)}
      </div>
    )
  } else {
    return null
  }
}