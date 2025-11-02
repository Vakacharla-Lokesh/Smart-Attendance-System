"use client";

import { useEffect, useState } from "react";
import { DataTable } from "./data-table";
import { createColumns } from "./columns";
import { Button } from "@/components/ui/button";

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const studentsRes = await fetch("/api/students");
      const students = await studentsRes.json();

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
        status: presentEnrolls.has(s.enroll_number) ? "present" : "inactive",
      }));

      // Add punch-only enrollments (extra data)
      const existing = new Set(rows.map((r) => r.enrollNo));
      for (const p of punches) {
        const enr = p.enroll_number;
        if (enr && !existing.has(enr)) {
          rows.push({
            id: enr,
            name: enr,
            course: "-",
            enrollNo: enr,
            status: "present",
          });
          existing.add(enr);
        }
      }

      setData(rows);
      setLoading(false);
    }

    load();
  }, []);

  const updateStatus = (
    id: string,
    newStatus: "present" | "absent" | "leave" | "inactive" | undefined
  ) => {
    setData((prev) =>
      prev.map((row) => (row.id === id ? { ...row, status: newStatus } : row))
    );
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const presentStudents = data
        .filter((row) => row.status === "present")
        .map((row) => row.enrollNo);

      if (presentStudents.length === 0) {
        alert("No students marked as present");
        setSaving(false);
        return;
      }

      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enroll_numbers: presentStudents }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`✅ Attendance saved for ${presentStudents.length} students!`);
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (err) {
      console.error("Error saving attendance:", err);
      alert("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-10 px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-rose-400">
          Attendance Management
        </h1>
        <Button
          onClick={handleSaveAttendance}
          disabled={saving}
          className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2 rounded-lg font-semibold"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      </div>

      {/* Data Table */}
      <div className="rounded-xl overflow-hidden border border-gray-800 shadow-lg">
        <DataTable columns={createColumns(updateStatus)} data={data} />
      </div>

      {loading && (
        <div className="mt-4 text-sm text-gray-400">Loading...</div>
      )}
    </div>
  );
}
