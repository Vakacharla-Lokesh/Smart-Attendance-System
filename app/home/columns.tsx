"use client";

import { ColumnDef } from "@tanstack/react-table";

type AttendanceRecord = {
  id: string;
  name: string;
  course: string;
  enrollNo: string;
  status: "present" | "absent" | "leave";
};

export const columns: ColumnDef<AttendanceRecord>[] = [
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
      const status = row.original.status;
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
      );
    },
  },
];

// Export a function that creates columns with the updateStatus callback
export const createColumns = (
  updateStatus: (id: string, newStatus: AttendanceRecord["status"]) => void
): ColumnDef<AttendanceRecord>[] => [
  ...columns,
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const id = row.original.id;
      return (
        <div className="flex gap-2">
          <button
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            onClick={() => updateStatus(id, "present")}
          >
            Present
          </button>
          <button
            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
            onClick={() => updateStatus(id, "absent")}
          >
            Absent
          </button>
          <button
            className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
            onClick={() => updateStatus(id, "leave")}
          >
            Leave
          </button>
        </div>
      );
    },
  },
];
