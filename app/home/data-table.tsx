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
  onStatusChange?: (rowIndex: number, status: string) => void
}

export function DataTable<TData extends { name?: string; course?: string; enrollNo?: string; status?: string }, TValue>({
  columns,
  data,
  onStatusChange,
}: DataTableProps<TData, TValue>) {
  const [tableData, setTableData] = React.useState<TData[]>(data)

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
    globalFilterFn: (row, columnId, filterValue) => {
      return (
        row.original.name?.toLowerCase().includes(filterValue.toLowerCase()) ||
        row.original.enrollNo?.toLowerCase().includes(filterValue.toLowerCase())
      )
    },
  })

  // filtering data manually before passing to rows
  const filteredRows = tableData.filter((row) => {
    const matchCourse = courseFilter === "all" || row.course === courseFilter
    const matchStatus = statusFilter === "all" || row.status === statusFilter
    const matchSearch =
      globalFilter === "" ||
      row.name?.toLowerCase().includes(globalFilter.toLowerCase()) ||
      row.enrollNo?.toLowerCase().includes(globalFilter.toLowerCase())
    return matchCourse && matchStatus && matchSearch
  })

  // handle status change
  const updateStatus = (rowIndex: number, status: "present" | "absent" | "leave") => {
    const updated = [...tableData]
    updated[rowIndex] = {
      ...updated[rowIndex],
      status: status,
    }
    setTableData(updated)
    if (onStatusChange) onStatusChange(rowIndex, status)
  }

  // counts
  const counts = {
    present: tableData.filter((row) => row.status === "present").length,
    absent: tableData.filter((row) => row.status === "absent").length,
    leave: tableData.filter((row) => row.status === "leave").length,
  }

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
      <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th key={header.id} className="p-2 border-b cursor-pointer">
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
              <th className="p-2 border-b">Actions</th>
            </tr>
          ))}
        </thead>
        <tbody>
          {filteredRows.map((row, i) => {
            const status = row.status
            const rowColor =
              status === "present"
                ? "bg-blue-100"
                : status === "absent"
                ? "bg-red-100"
                : "bg-yellow-100"

            return (
              <tr key={row.id} className={`${rowColor}`}>
                {table.getHeaderGroups()[0].headers.map((header) => {
                  const accessor = header.column.columnDef.accessorKey as keyof typeof row
                  return (
                    <td key={header.id} className="p-2 border-b text-center">
                      {row[accessor] as string}
                    </td>
                  )
                })}
                <td className="p-2 border-b text-center space-x-2">
                  <button
                    className="px-2 py-1 bg-blue-500 text-white rounded"
                    onClick={() => updateStatus(i, "present")}
                  >
                    Present
                  </button>
                  <button
                    className="px-2 py-1 bg-red-500 text-white rounded"
                    onClick={() => updateStatus(i, "absent")}
                  >
                    Absent
                  </button>
                  <button
                    className="px-2 py-1 bg-yellow-500 text-white rounded"
                    onClick={() => updateStatus(i, "leave")}
                  >
                    Leave
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Counts */}
      <div className="flex gap-4 font-medium">
        <span className="text-blue-100">Present: {counts.present}</span>
        <span className="text-red-100">Absent: {counts.absent}</span>
        <span className="text-yellow-100">Leave: {counts.leave}</span>
      </div>
    </div>
  )
}
