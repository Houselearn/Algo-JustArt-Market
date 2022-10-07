import React, { useState } from "react";
import { Input, Modal, Button } from "components";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { useRouter } from "next/router";
import { relistItem } from "lib/utils/market";
import { fetchBalance } from 'lib/utils/wallet';
import { Item } from "lib/interfaces"
import { stringToMicroAlgos } from "lib/utils/conversions";


function ListItemModal({ address, item, handleClose }: { address: string, item: Item, handleClose: Function }) {
    const { register, handleSubmit } = useForm<any>({ defaultValues: { duration: "86400", type: "0" } });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleCreate(params) {
        try {
            setLoading(true)
            await relistItem(address, item, params.location, stringToMicroAlgos(params.price),)
            toast.success('Item relisted')
        } catch (e) {
            console.log({ e });
            toast.error("Failed to list item");
        } finally {
            setLoading(false);
            handleClose();
            fetchBalance(address);
            router.reload();
        }
    }

    return (
        <Modal onClose={handleClose}>

            <div className="container my-12">
                <div className="max-w-lg mx-auto bg-gray-900 rounded-sm p-8">
                    <h1 className="text-3xl font-semibold text-red-500">List Item</h1>
                    <p>
                        List Item listing using this form.
                    </p>
                    <hr className="my-8" />
                    <form onSubmit={handleSubmit(handleCreate)}>
                        <div className="space-y-6">
                            <div>
                                <Input
                                    type="text"
                                    label="Location"
                                    {...register('location', { required: true })}
                                />
                            </div>
                            <div>
                                <Input
                                    type="number"
                                    label="Listing Price (in ALGO)"
                                    {...register('price', { required: true })}
                                />
                            </div>
                            <Button type="submit" loading={loading}>
                                List Item
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </Modal>
    )
}

export default ListItemModal;