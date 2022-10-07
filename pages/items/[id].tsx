import { useRouter, withRouter } from "next/router"
import React from "react";
import Details from "./details";

function ItemDetails() {
  const router = useRouter();
  const id = router.query.id as string;

  return (
    <Details id={Number(id)} />
  )
}

export default withRouter(ItemDetails);