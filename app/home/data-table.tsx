"use client";

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

interface TableData {
  id: string;
  name: string;
  course: string;
  enrollNo: string;
  status?: "present" | "absent" | "leave" | "inactive";
}

export function DataTable<TData extends TableData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [tableData, setTableData] = React.useState<TData[]>(data);

  React.useEffect(() => {
    setTableData(data);
  }, [data]);

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [courseFilter, setCourseFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      globalFilter,
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const rowData = row.original;
      return (
        rowData.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        rowData.enrollNo.toLowerCase().includes(filterValue.toLowerCase())
      );
    },
  });

  const counts = React.useMemo(
    () => ({
      present: tableData.filter((row) => row.status === "present").length,
      absent: tableData.filter((row) => row.status === "absent").length,
      leave: tableData.filter((row) => row.status === "leave").length,
    }),
    [tableData]
  );

  return (
    <div className="space-y-6">
      {/* 🔍 Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or enroll no..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="bg-[#1a1a1a] border border-gray-700 text-white px-3 py-2 rounded-lg w-64 focus:outline-none focus:border-gray-500"
        />

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="bg-[#1a1a1a] border border-gray-700 text-white px-3 py-2 rounded-lg"
        >
          <option value="all">All Courses</option>
          {[...new Set(tableData.map((row) => row.course))].map((course) => (
            <option key={course} value={course}>
              {course}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1a1a1a] border border-gray-700 text-white px-3 py-2 rounded-lg"
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="leave">Leave</option>
        </select>

        <select
          onChange={(e) => setSorting([{ id: e.target.value, desc: false }])}
          className="bg-[#1a1a1a] border border-gray-700 text-white px-3 py-2 rounded-lg"
        >
          <option value="">Sort By</option>
          <option value="name">Name</option>
          <option value="enrollNo">Enroll No</option>
          <option value="course">Course</option>
        </select>
      </div>

      {/* 🧾 Table */}
      <div className="rounded-xl overflow-hidden border border-gray-800 shadow-lg bg-[#0d0d0d]">
        <table className="w-full text-left border-collapse">
          {/* ✅ Simplified Header (No strong rose shade) */}
          <thead className="bg-[#1f1f1f] text-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-sm font-semibold uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() && (
                          <span>{header.column.getIsSorted() === "asc" ? "↑" : "↓"}</span>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            {table.getRowModel().rows.map((row, index) => {
              const status = (row.original as any).status;
              const rowColor =
                status === "present"
                  ? "bg-rose-900/20"
                  : status === "absent"
                  ? "bg-red-900/20"
                  : status === "leave"
                  ? "bg-yellow-900/20"
                  : "bg-[#121212]";
              const inactiveClass =
                status === "inactive" ? "opacity-60 text-gray-500" : "text-gray-200";

              return (
                <tr
                  key={row.id ?? index}
                  className={`${rowColor} border-b border-gray-800 hover:bg-gray-800/40 transition`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className={`px-4 py-3 text-sm ${inactiveClass}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 🔢 Summary */}
      <div className="flex gap-6 text-sm font-semibold tracking-wide">
        <span className="text-rose-400">Present: {counts.present}</span>
        <span className="text-red-500">Absent: {counts.absent}</span>
        <span className="text-yellow-400">Leave: {counts.leave}</span>
      </div>
    </div>
  );
}
