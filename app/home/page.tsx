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
        status: presentEnrolls.has(s.enroll_number) ? "present" : "inactive",
      }));

      // Add any punch-only enrollments
      const existingEnrolls = new Set(rows.map((r) => r.enrollNo));
      for (const p of punches) {
        const enr = p.enroll_number;
        if (enr && !existingEnrolls.has(enr)) {
          rows.push({
            id: enr,
            name: enr,
            course: "-",
            enrollNo: enr,
            status: "present",
          });
          existingEnrolls.add(enr);
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
      // Get all students marked as present
      const presentStudents = data
        .filter((row) => row.status === "present")
        .map((row) => row.enrollNo);

      if (presentStudents.length === 0) {
        alert("No students marked as present");
        setSaving(false);
        return;
      }

      // Call the attendance API
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          enroll_numbers: presentStudents,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert(
          `Attendance saved successfully for ${presentStudents.length} students!`
        );
        console.log("Results:", result);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      alert("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <Button
          onClick={handleSaveAttendance}
          disabled={saving}
          size="lg"
          className="bg-green-600 hover:bg-green-700"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </Button>
      </div>

      <DataTable
        columns={createColumns(updateStatus)}
        data={data}
      />
      {loading && <div className="mt-4 text-sm text-gray-500">Loading...</div>}
    </div>
  );
}
