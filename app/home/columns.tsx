"use client"

import { ColumnDef } from "@tanstack/react-table"


type AttendanceRecord = {
  id: string
  name: string
  course: string
  enrollNo: string
  status: "present" | "absent" | "leave"
}

export const columns = (
  updateStatus: (id: string, newStatus: AttendanceRecord["status"]) => void
): ColumnDef<AttendanceRecord>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "course",
    header: "Course",
  },
  {
    accessorKey: "enrollNo",
    header: "Enroll No",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <span
          className={
            status === "present"
              ? "text-blue-600 font-medium"
              : status === "absent"
              ? "text-red-600 font-medium"
              : "text-yellow-600 font-medium"
          }
        >
          {status.toUpperCase()}
        </span>
      )
    },
  },
  
]



