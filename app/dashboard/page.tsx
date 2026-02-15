"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Clock,
  TrendingUp,
  Activity,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Stats, Punch } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    todayPunches: 0,
    currentlyInside: 0,
  });
  const [recentPunches, setRecentPunches] = useState<Punch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch students
      const studentsRes = await fetch("/api/students");
      const studentsData = await studentsRes.json();

      // Fetch recent punches
      const punchesRes = await fetch("/api/punch?limit=10");
      const punchesData = await punchesRes.json();

      if (studentsData.success && punchesData.success) {
        const students = studentsData.data || [];
        const punches = punchesData.data || [];

        // Calculate today's punches
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayPunches = punches.filter(
          (p: Punch) => new Date(p.punch_time) >= today,
        ).length;

        // Calculate currently inside (last punch was 'in')
        const studentLastPunches = new Map();
        punches.forEach((punch: Punch) => {
          const studentId =
            typeof punch.student_id === "object"
              ? punch.student_id._id
              : punch.student_id;
          if (!studentLastPunches.has(studentId)) {
            studentLastPunches.set(studentId, punch);
          }
        });

        const currentlyInside = Array.from(studentLastPunches.values()).filter(
          (p) => p.punch_type === "in",
        ).length;

        setStats({
          totalStudents: students.length,
          activeStudents: students.filter((s: any) => s.is_active).length,
          todayPunches,
          currentlyInside,
        });

        setRecentPunches(punches.slice(0, 10));
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
    }
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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Attendance Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time attendance monitoring and statistics
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Students */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">
              Total Students
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalStudents}
            </p>
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <span>{stats.activeStudents} active</span>
            </p>
          </div>

          {/* Currently Inside */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">
              Currently Inside
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.currentlyInside}
            </p>
            <p className="text-sm text-gray-500 mt-2">Students on campus</p>
          </div>

          {/* Today's Punches */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">
              Today&apos;s Punches
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.todayPunches}
            </p>
            <p className="text-sm text-gray-500 mt-2">Total check-ins/outs</p>
          </div>

          {/* Attendance Rate */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium">
              Attendance Rate
            </h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">
              {stats.totalStudents > 0
                ? Math.round(
                    (stats.currentlyInside / stats.totalStudents) * 100,
                  )
                : 0}
              %
            </p>
            <p className="text-sm text-gray-500 mt-2">Current presence</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            <p className="text-gray-600 text-sm mt-1">
              Latest check-ins and check-outs
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
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
                    Time
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Scanner
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentPunches.map((punch) => (
                  <tr
                    key={punch._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">
                        {typeof punch.student_id === "object" &&
                        punch.student_id !== null
                          ? punch.student_id.name
                          : "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {typeof punch.student_id === "object" &&
                      punch.student_id !== null
                        ? punch.student_id.enroll_number
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {typeof punch.student_id === "object" &&
                        punch.student_id !== null
                          ? punch.student_id.course
                          : "N/A"}
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatTime(punch.punch_time)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(punch.punch_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {punch.scanner_id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recentPunches.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
