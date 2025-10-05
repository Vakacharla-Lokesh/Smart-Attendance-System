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
      if (!status) return <span className="text-gray-600">-</span>;
      const cls =
        status === "present"
          ? "text-blue-600 font-medium"
          : status === "absent"
          ? "text-red-600 font-medium"
          : "text-yellow-600 font-medium";
      return <span className={cls}>{status.toUpperCase()}</span>;
    },
  },
];

// Export a function that creates columns with the updateStatus callback
export const createColumns = (
  updateStatus: (id: string, newStatus: AttendanceRecord["status"]) => void
): ColumnDef<AttendanceRecord, unknown>[] => [
  ...columns,
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const id = row.original.id;
      const inactive = row.original.status === 'inactive';
      return (
        <div className="flex gap-2">
          <button
            className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
            onClick={() => updateStatus(id, "present")}
            disabled={inactive}
          >
            Present
          </button>
          <button
            className="px-2 py-1 bg-red-500 text-white rounded text-xs"
            onClick={() => updateStatus(id, "absent")}
            disabled={inactive}
          >
            Absent
          </button>
          <button
            className="px-2 py-1 bg-yellow-500 text-white rounded text-xs"
            onClick={() => updateStatus(id, "leave")}
            disabled={inactive}
          >
            Leave
          </button>
        </div>
      );
    },
  },
];
