"use client";

import { ColumnDef } from "@tanstack/react-table";

type AttendanceRecord = {
  id: string;
  name: string;
  course: string;
  enrollNo: string;
  status?: "present" | "absent" | "leave" | "inactive";
};

export const columns: ColumnDef<AttendanceRecord, unknown>[] = [
  {
    accessorKey: "name",
    header: () => <span className="text-rose-400">Name</span>,
  },
  {
    accessorKey: "course",
    header: () => <span className="text-rose-400">Course</span>,
  },
  {
    accessorKey: "enrollNo",
    header: () => <span className="text-rose-400">Enroll No</span>,
  },
  {
    accessorKey: "status",
    header: () => <span className="text-rose-400">Status</span>,
    cell: ({ row }) => {
      const status = row.original.status;
      const color =
        status === "present"
          ? "text-green-400"
          : status === "absent"
          ? "text-red-400"
          : status === "leave"
          ? "text-yellow-400"
          : "text-gray-500";
      return (
        <span className={`capitalize font-semibold ${color}`}>
          {status || "-"}
        </span>
      );
    },
  },
];

export const createColumns = (
  updateStatus: (id: string, newStatus: AttendanceRecord["status"]) => void
): ColumnDef<AttendanceRecord, unknown>[] => [
  ...columns,
  {
    id: "actions",
    header: () => <span className="text-rose-400">Actions</span>,
    cell: ({ row }) => {
      const id = row.original.id;
      const inactive = row.original.status === "inactive";

      return (
        <div className="flex gap-2">
          <button
            onClick={() => updateStatus(id, "present")}
            disabled={inactive}
            className={`px-3 py-1 text-xs rounded-md font-semibold ${
              inactive
                ? "bg-gray-700 text-gray-400"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            Present
          </button>
          <button
            onClick={() => updateStatus(id, "absent")}
            disabled={inactive}
            className={`px-3 py-1 text-xs rounded-md font-semibold ${
              inactive
                ? "bg-gray-700 text-gray-400"
                : "bg-red-600 hover:bg-red-700 text-white"
            }`}
          >
            Absent
          </button>
          <button
            onClick={() => updateStatus(id, "leave")}
            disabled={inactive}
            className={`px-3 py-1 text-xs rounded-md font-semibold ${
              inactive
                ? "bg-gray-700 text-gray-400"
                : "bg-yellow-500 hover:bg-yellow-600 text-black"
            }`}
          >
            Leave
          </button>
        </div>
      );
    },
  },
];
