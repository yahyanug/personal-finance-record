"use client";

import { useState } from "react";
import TransactionTable from "./transaction-table";
import { useQuery } from "@tanstack/react-query";
import { getTransactions } from "@/features/transaction/action";
import CreateTransactionCard from "./create-transaction-card";

export default function Transaction() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["transactions", page, limit, search],
    queryFn: () => getTransactions({ page, limit, search }),
  });

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="min-w-0 md:col-span-2">
        <TransactionTable
          transaction={data}
          isLoading={isLoading}
          refetch={refetch}
          page={page}
          limit={limit}
          search={search}
          setPage={setPage}
          setLimit={setLimit}
          setSearch={setSearch}
        />
      </div>
      <CreateTransactionCard refetch={refetch} />
    </div>
  );
}
