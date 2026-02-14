// FILE: app/attendance/page.js
// PAGE: Attendance Records Page - View, filter, and export attendance records
// ROUTE: /attendance

"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Download,
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Punch, Student, Filters } from "@/types";

export default function AttendancePage() {
  const [punches, setPunches] = useState<Punch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    studentId: "",
    startDate: "",
    endDate: "",
    punchType: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch students
      const studentsRes = await fetch("/api/students");
      const studentsData = await studentsRes.json();
      if (studentsData.success) {
        setStudents(studentsData.data || []);
      }

      // Fetch punches
      await fetchPunches();

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLoading(false);
    }
  };

  const fetchPunches = async () => {
    try {
      let url = "/api/punch?limit=100";

      if (filters.studentId) url += `&student_id=${filters.studentId}`;
      if (filters.startDate) url += `&start_date=${filters.startDate}`;
      if (filters.endDate) url += `&end_date=${filters.endDate}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        let filteredPunches = data.data || [];

        if (filters.punchType) {
          filteredPunches = filteredPunches.filter(
            (p: Punch) => p.punch_type === filters.punchType,
          );
        }

        setPunches(filteredPunches);
      }
    } catch (error) {
      console.error("Error fetching punches:", error);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchPunches();
  };

  const clearFilters = () => {
    setFilters({
      studentId: "",
      startDate: "",
      endDate: "",
      punchType: "",
      dateFrom: "",
      dateTo: "",
    });
    setTimeout(() => fetchPunches(), 100);
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Time",
      "Student Name",
      "Enrollment No",
      "Course",
      "Action",
      "Scanner ID",
    ];
    const rows = punches.map((punch: Punch) => [
      new Date(punch.punch_time).toLocaleDateString(),
      new Date(punch.punch_time).toLocaleTimeString(),
      typeof punch.student_id === 'object' ? punch.student_id?.name || "Unknown" : "Unknown",
      typeof punch.student_id === 'object' ? punch.student_id?.enroll_number || "N/A" : "N/A",
      typeof punch.student_id === 'object' ? punch.student_id?.course || "N/A" : "N/A",
      punch.punch_type === "in" ? "Check In" : "Check Out",
      punch.scanner_id,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatTime = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading attendance records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Attendance Records
              </h1>
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            View and manage attendance records
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student
              </label>
              <select
                value={filters.studentId}
                onChange={(e) =>
                  handleFilterChange("studentId", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Students</option>
                {students.map((student) => (
                  <option
                    key={student._id}
                    value={student._id}
                  >
                    {student.name} ({student.enroll_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Punch Type
              </label>
              <select
                value={filters.punchType}
                onChange={(e) =>
                  handleFilterChange("punchType", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Types</option>
                <option value="in">Check In</option>
                <option value="out">Check Out</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={applyFilters}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Records</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {punches.length}
                </p>
              </div>
              <Calendar className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Check Ins</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {punches.filter((p) => p.punch_type === "in").length}
                </p>
              </div>
              <ArrowDown className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Check Outs</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {punches.filter((p) => p.punch_type === "out").length}
                </p>
              </div>
              <ArrowUp className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Enrollment No.
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Scanner
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {punches.map((punch) => (
                  <tr
                    key={punch._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatTime(punch.punch_time)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(punch.punch_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {typeof punch.student_id === 'object' && punch.student_id !== null ? punch.student_id.name : "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {typeof punch.student_id === 'object' && punch.student_id !== null ? punch.student_id.enroll_number : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {typeof punch.student_id === 'object' && punch.student_id !== null ? punch.student_id.course : "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {punch.punch_type === "in" ? (
                        <span className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full w-fit">
                          <ArrowDown className="w-3 h-3" />
                          Check In
                        </span>
                      ) : (
                        <span className="flex items-center gap-2 px-3 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full w-fit">
                          <ArrowUp className="w-3 h-3" />
                          Check Out
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {punch.scanner_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {punches.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
