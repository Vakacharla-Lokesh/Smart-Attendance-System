import { columns } from "./columns";
import { DataTable } from "./data-table";

type Payment = {
  id: string;
  amount: number;
  status: "pending" | "processing" | "success" | "failed";
  email: string;
};

async function getData(): Promise<Payment[]> {
  // Replace with actual API call
  return [
    { id: "1", amount: 100, status: "pending", email: "a@example.com" },
    { id: "2", amount: 200, status: "success", email: "b@example.com" },
    // ... more sample data
  ];
}

export default async function Page() {
  const data = await getData();

  return (
    <div className="container mx-auto py-10 px-10">
      <DataTable
        columns={columns}
        data={data}
      />
    </div>
  );
}
