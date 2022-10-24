import { Button, Input, Layout, Select } from "components";
import { useAlgoWeb3Context } from "lib/utils/algoweb3";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { addNewItem } from "../lib/utils/market"
import { connectWallet, fetchBalance } from 'lib/utils/wallet';
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { stringToMicroAlgos } from "lib/utils/conversions";

function Create() {
  const { state: { address }, updateBalance } = useAlgoWeb3Context()
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { register, handleSubmit } = useForm<any>({ defaultValues: { duration: "86400", type: "0" } });

  async function update() {
    const balance = await fetchBalance(address)
    updateBalance(balance)
  }

  async function handleCreate(params) {
    let id: string = "/"
    if (!address) {
      await connectWallet();
    }
    try {
      setLoading(true)
      id = await addNewItem(address, { name: params.name, description: params.description, image: params.image, location: params.location, currPrice: stringToMicroAlgos(params.price) })
      toast.success('Listing created')
    } catch (e) {
      console.log({ e });
      toast.error("Failed to create a Item.");
    } finally {
      await update()
      setLoading(false)
    }
    if (id !== "/") {
      router.push(`/items/${id}`);
    }
  }

  const buttonLabel = !address ? 'Connect Wallet' : 'Create Listing';

  return (
    <Layout>
      <div className="container my-12">
        <div className="max-w-lg mx-auto bg-gray-900 rounded-sm p-8">
          <h1 className="text-3xl font-semibold text-red-500">Create Listing</h1>
          <p>
            Create a New Item listing using this form.
          </p>
          <hr className="my-8" />
          <form onSubmit={handleSubmit(handleCreate)}>
            <div className="space-y-6">
              <div>
                <Input
                  label="Item Name"
                  {...register('name', { required: true })}
                />
              </div>
              <div>
                <Input
                  label="Item Description"
                  {...register('description', { required: true })}
                />
              </div>
              <div>
                <Input
                  label="Item Image URL"
                  {...register('image', { required: true })}
                />
              </div>
              <div>
                <Input

                  label="Item Location"
                  {...register('location', { required: true })}
                />
              </div>
              <div>
                <Input
                  type="number"
                  label="Price (in ALGO)"
                  {...register('price', { required: true })}
                />
              </div>
              <Button type="submit" loading={loading}>
                {buttonLabel}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default Create;