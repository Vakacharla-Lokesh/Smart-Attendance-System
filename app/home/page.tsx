"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";

type AttendanceRecord = {
  id: string;
  name: string;
  course: string;
  enrollNo: string;
  status?: "present" | "absent" | "leave" | "inactive";
};

export default function Page() {
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // fetch all students
      const studentsRes = await fetch("/api/students");
      const students = await studentsRes.json();

      // fetch today's punch records
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];
      const punchesRes = await fetch(`/api/punch?date=${dateStr}`);
      const punches = await punchesRes.json();

      const presentEnrolls = new Set(punches.map((p: any) => p.enroll_number));

      const rows: AttendanceRecord[] = students.map((s: any) => ({
        id: s.id || s._id,
        name: s.name,
        course: s.course || "-",
        enrollNo: s.enroll_number || s.enrollNo || "",
        // Do not auto-mark present. Only mark as "inactive" when student has NO punch record.
        status: presentEnrolls.has(s.enroll_number) ? undefined : "inactive",
      }));

      setData(rows);
      setLoading(false);
    }

    load();
  }, []);

  const updateStatus = (
    id: string,
    newStatus: "present" | "absent" | "leave" | "inactive" | undefined
  ) => {
    setData((prev) => prev.map((row) => (row.id === id ? { ...row, status: newStatus } : row)));
  };

  return (
    <div className="container mx-auto py-10">
      <DataTable columns={createColumns(updateStatus)} data={data} />
      {loading && <div className="mt-4 text-sm text-gray-500">Loading...</div>}
    </div>
  );
}
