// "use client"

// import * as React from "react"
// import {
//   useReactTable,
//   getCoreRowModel,
//   flexRender,
//   ColumnDef,
// } from "@tanstack/react-table"

// interface DataTableProps<TData, TValue> {
//   columns: ColumnDef<TData, TValue>[]
//   data: TData[]
//   onStatusChange?: (rowIndex: number, status: string) => void
// }

// export function DataTable<TData, TValue>({
//   columns,
//   data,
//   onStatusChange,
// }: DataTableProps<TData, TValue>) {
//   const [tableData, setTableData] = React.useState<TData[]>(data)

//   const table = useReactTable({
//     data: tableData,
//     columns,
//     getCoreRowModel: getCoreRowModel(),
//   })

//   // handle status change (present / absent / leave)
//   // handle status change (present / absent / leave)
// const updateStatus = (rowIndex: number, status: "present" | "absent" | "leave") => {
//   const updated = [...tableData]
//   updated[rowIndex] = {
//     ...updated[rowIndex],
//     status: status,
//   }
//   setTableData(updated)

//   if (onStatusChange) onStatusChange(rowIndex, status)
// }

// // count totals
// const counts = {
//   present: tableData.filter((row) => row.status === "present").length,
//   absent: tableData.filter((row) => row.status === "absent").length,
//   leave: tableData.filter((row) => row.status === "leave").length,
// }


//   return (
//     <div className="space-y-4">
//       <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
//         <thead className="bg-gray-100">
//           {table.getHeaderGroups().map(headerGroup => (
//             <tr key={headerGroup.id}>
//               {headerGroup.headers.map(header => (
//                 <th key={header.id} className="p-2 border-b">
//                   {header.isPlaceholder
//                     ? null
//                     : flexRender(
//                         header.column.columnDef.header,
//                         header.getContext()
//                       )}
//                 </th>
//               ))}
//               <th className="p-2 border-b">Actions</th>
//             </tr>
//           ))}
//         </thead>
//         <tbody>
//           {table.getRowModel().rows.map(row => {
//             const status = (row.original as any).status
//             const rowColor =
//               status === "present"
//                 ? "bg-blue-100"
//                 : status === "absent"
//                 ? "bg-red-100"
//                 : status === "leave"
//                 ? "bg-yellow-100"
//                 : ""

//             return (
//               <tr key={row.id} className={`${rowColor}`}>
//                 {row.getVisibleCells().map(cell => (
//                   <td key={cell.id} className="p-2 border-b text-center">
//                     {flexRender(cell.column.columnDef.cell, cell.getContext())}
//                   </td>
//                 ))}
//                 <td className="p-2 border-b text-center space-x-2">
//                   <button
//                     className="px-2 py-1 bg-blue-500 text-white rounded"
//                     onClick={() => updateStatus(row.index, "present")}
//                   >
//                     Present
//                   </button>
//                   <button
//                     className="px-2 py-1 bg-red-500 text-white rounded"
//                     onClick={() => updateStatus(row.index, "absent")}
//                   >
//                     Absent
//                   </button>
//                   <button
//                     className="px-2 py-1 bg-yellow-500 text-white rounded"
//                     onClick={() => updateStatus(row.index, "leave")}
//                   >
//                     Leave
//                   </button>
//                 </td>
//               </tr>
//             )
//           })}
//         </tbody>
//       </table>

//       {/* Counts */}
//       <div className="flex gap-4 font-medium">
//         <span className="text-blue-600">Present: {counts.present}</span>
//         <span className="text-red-600">Absent: {counts.absent}</span>
//         <span className="text-yellow-600">Leave: {counts.leave}</span>
//       </div>
//     </div>
//   )
// }


"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from "@tanstack/react-table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
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
  const [tableData, setTableData] = React.useState<TData[]>(data)

  // Keep internal table state in sync when parent `data` prop changes
  React.useEffect(() => {
    setTableData(data)
  }, [data])

  const [globalFilter, setGlobalFilter] = React.useState("")
  const [courseFilter, setCourseFilter] = React.useState("all")
  const [statusFilter, setStatusFilter] = React.useState("all")
  const [sorting, setSorting] = React.useState<SortingState>([])

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
  })

  // Note: rely on the TanStack table instance to provide rows so
  // header and body stay aligned. Use table state (globalFilter, sorting)
  // to let the table apply filtering/sorting via the provided plugins.

  // status updates are handled by the parent via `onStatusChange` passed in columns

  // counts
  const counts = React.useMemo(() => ({
    present: tableData.filter((row) => row.status === "present").length,
    absent: tableData.filter((row) => row.status === "absent").length,
    leave: tableData.filter((row) => row.status === "leave").length,
  }), [tableData])

  return (
    <div className="space-y-4">
      {/* 🔍 Search + Filters + Sort */}
      <div className="flex flex-wrap items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or enroll no..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="border rounded px-3 py-1"
        />

        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="border rounded px-3 py-1"
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
          className="border rounded px-3 py-1"
        >
          <option value="all">All Status</option>
          <option value="present">Present</option>
          <option value="absent">Absent</option>
          <option value="leave">Leave</option>
        </select>

        <select
          onChange={(e) =>
            setSorting([{ id: e.target.value, desc: false }])
          }
          className="border rounded px-3 py-1"
        >
          <option value="">Sort By</option>
          <option value="name">Name</option>
          <option value="enrollNo">Enroll No</option>
          <option value="course">Course</option>
        </select>
      </div>

      {/* Table */}
      <table className="min-w-full table-fixed border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="p-2 border-b text-left cursor-pointer"
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
          {table.getRowModel().rows.map((row) => {
            const status = (row.original as any).status
            const rowColor =
              status === "present"
                ? "bg-blue-50"
                : status === "absent"
                ? "bg-red-50"
                : status === "leave"
                ? "bg-yellow-50"
                : "bg-white"

            const inactiveClass = status === "inactive" ? "opacity-50 text-gray-400" : ""

            return (
              <tr key={row.id} className={`${rowColor} hover:bg-gray-50 ${inactiveClass}`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-2 border-b text-left">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Counts */}
      <div className="flex gap-4 font-medium">
        <span className="text-blue-600">Present: {counts.present}</span>
        <span className="text-red-600">Absent: {counts.absent}</span>
        <span className="text-yellow-600">Leave: {counts.leave}</span>
      </div>
    </div>
  )
}
