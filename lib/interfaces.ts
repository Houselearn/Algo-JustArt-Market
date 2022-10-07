export interface Item {
  appId?: number;
  appAddress?: string;
  name: string;
  description: string;
  image: string;
  location: string;
  currPrice: number;
  prevPrice?: number;
  currOwner?: string;
  isItemListed?: number;
  history?: Transaction[];
}

export interface Transaction {
  txHash: string;
  type: string;
  from: string;
  price: number;
  createdAt: number;
}