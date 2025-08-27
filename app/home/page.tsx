// import { columns } from "./columns";
// import { DataTable } from "./data-table";

// type Payment = {
//   id: string;
//   amount: number;
//   status: "pending" | "processing" | "success" | "failed";
//   email: string;
// };

// async function getData(): Promise<Payment[]> {
//   // Replace with actual API call
//   return [
//     { id: "1", amount: 100, status: "pending", email: "a@example.com" },
//     { id: "2", amount: 200, status: "success", email: "b@example.com" },
//     // ... more sample data
//   ];
// }

// export default async function Page() {
//   const data = await getData();

//   return (
//     <div className="container mx-auto py-10 px-10">
//       <DataTable
//         columns={columns}
//         data={data}
//       />
//     </div>
//   );
// }


"use client"

import { useState } from "react"
import { DataTable } from "./data-table"
import { columns } from "./columns"

type AttendanceRecord = {
  id: string
  name: string
  course: string
  enrollNo: string
  status: "present" | "absent" | "leave"
}

const initialData: AttendanceRecord[] = [
  { id: "1", name: "Alice Johnson", course: "B.Tech CSE", enrollNo: "101", status: "leave" },
  { id: "2", name: "Bob Smith", course: "MBA", enrollNo: "102", status: "leave" },
  { id: "3", name: "Charlie Brown", course: "BBA", enrollNo: "103", status: "leave" },
  { id: "4", name: "Diana Prince", course: "B.Tech IT", enrollNo: "104", status: "leave" },
  { id: "5", name: "Ethan Hunt", course: "B.Sc Physics", enrollNo: "105", status: "leave" },
  { id: "6", name: "Fiona Gallagher", course: "B.Com", enrollNo: "106", status: "leave" },
  { id: "7", name: "George Miller", course: "MBA", enrollNo: "107", status: "leave" },
  { id: "8", name: "Hannah Lee", course: "B.Tech CSE", enrollNo: "108", status: "leave" },
  { id: "9", name: "Ian Wright", course: "BBA", enrollNo: "109", status: "leave" },
  { id: "10", name: "Julia Roberts", course: "B.Sc Maths", enrollNo: "110", status: "leave" },
  { id: "11", name: "Kevin Hart", course: "B.Tech ECE", enrollNo: "111", status: "leave" },
  
]

export default function Page() {
  const [data, setData] = useState<AttendanceRecord[]>(initialData)

  const updateStatus = (id: string, newStatus: "present" | "absent" | "leave") => {
    setData(prev =>
      prev.map(row =>
        row.id === id ? { ...row, status: newStatus } : row
      )
    )
  }

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={columns(updateStatus)} data={data} />
    </div>
  )
}

