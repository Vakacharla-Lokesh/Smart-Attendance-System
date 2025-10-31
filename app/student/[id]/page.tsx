"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  PieLabelRenderProps,
} from "recharts";

interface StudentData {
  name: string;
  enroll_number: string;
}

interface AttendanceData {
  enroll_number: string;
  present_dates: string[];
  total_present: number;
}

interface MonthlyStats {
  month: string;
  year: number;
  totalWeekdays: number;
  presentDays: number;
  percentage: number;
}

export default function StudentAnalyticsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const countWeekdaysInMonth = (year: number, month: number): number => {
    const daysInMonth = new Date(year, month, 0).getDate();
    let weekdayCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        weekdayCount++;
      }
    }

    return weekdayCount;
  };

  const calculateMonthlyStats = useCallback(
    (presentDates: string[]): MonthlyStats[] => {
      const monthMap = new Map<
        string,
        { present: Set<string>; year: number; month: number }
      >();

      // Group present dates by month
      presentDates.forEach((dateStr) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, "0")}`;

        if (!monthMap.has(key)) {
          monthMap.set(key, { present: new Set(), year, month });
        }
        monthMap.get(key)!.present.add(dateStr);
      });

      const stats: MonthlyStats[] = [];

      monthMap.forEach((value, key) => {
        const weekdays = countWeekdaysInMonth(value.year, value.month);
        const presentDays = value.present.size;
        const percentage = weekdays > 0 ? (presentDays / weekdays) * 100 : 0;

        stats.push({
          month: key,
          year: value.year,
          totalWeekdays: weekdays,
          presentDays,
          percentage: Math.round(percentage * 100) / 100,
        });
      });

      stats.sort((a, b) => b.month.localeCompare(a.month));

      return stats;
    },
    []
  );

  useEffect(() => {
    async function loadData() {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch student details
        const studentRes = await fetch(`/api/students/${id}`);
        const studentData = await studentRes.json();
        setStudent(studentData);

        // Fetch attendance records
        const attendanceRes = await fetch(`/api/attendance/${id}`);

        if (attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          setAttendance(attendanceData);

          // Calculate monthly statistics
          const stats = calculateMonthlyStats(attendanceData.present_dates);
          setMonthlyStats(stats);

          // Set current month as default
          if (stats.length > 0) {
            setSelectedMonth(
              `${stats[0].year}-${String(stats[0].month).padStart(2, "0")}`
            );
          }
        } else {
          setAttendance(null);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id, calculateMonthlyStats]);

  const getMonthName = (monthStr: string): string => {
    const [year, month] = monthStr.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getCurrentMonthData = () => {
    const current = monthlyStats.find((s) => s.month === selectedMonth);
    if (!current) return null;

    const presentDays = current.presentDays;
    const absentDays = current.totalWeekdays - presentDays;

    return [
      { name: "Present", value: presentDays, color: "#10b981" },
      { name: "Absent", value: absentDays, color: "#ef4444" },
    ];
  };

  const chartData = getCurrentMonthData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-10">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <Link href="/home">
            <Button variant="outline">← Back to Home</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Student Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="text-lg font-semibold">
                  {student?.name || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Enrollment Number</p>
                <p className="text-lg font-semibold">
                  {student?.enroll_number || id}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Present Days</p>
                <p className="text-lg font-semibold">
                  {attendance?.total_present || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {monthlyStats.length > 0 ? (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Monthly Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  {monthlyStats.map((stat) => (
                    <Button
                      key={stat.month}
                      variant={
                        selectedMonth === stat.month ? "default" : "outline"
                      }
                      onClick={() => setSelectedMonth(stat.month)}
                    >
                      {getMonthName(stat.month)}
                    </Button>
                  ))}
                </div>

                {chartData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-[400px]">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                      >
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props: PieLabelRenderProps) => {
                              const percent = Number(props.percent ?? 0);
                              return `${props.name}: ${(percent * 100).toFixed(
                                1
                              )}%`;
                            }}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex flex-col justify-center space-y-4">
                      {monthlyStats
                        .filter((s) => s.month === selectedMonth)
                        .map((stat) => (
                          <div
                            key={stat.month}
                            className="space-y-3"
                          >
                            <h3 className="text-xl font-semibold">
                              {getMonthName(stat.month)}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-green-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">
                                  Present Days
                                </p>
                                <p className="text-2xl font-bold text-green-600">
                                  {stat.presentDays}
                                </p>
                              </div>
                              <div className="bg-red-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">
                                  Absent Days
                                </p>
                                <p className="text-2xl font-bold text-red-600">
                                  {stat.totalWeekdays - stat.presentDays}
                                </p>
                              </div>
                              <div className="bg-blue-50 p-4 rounded-lg col-span-2">
                                <p className="text-sm text-gray-600">
                                  Attendance Percentage
                                </p>
                                <p className="text-3xl font-bold text-blue-600">
                                  {stat.percentage}%
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Months Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">Month</th>
                        <th className="p-3 text-center">Present</th>
                        <th className="p-3 text-center">Total Weekdays</th>
                        <th className="p-3 text-center">Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyStats.map((stat) => (
                        <tr
                          key={stat.month}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-3">{getMonthName(stat.month)}</td>
                          <td className="p-3 text-center font-semibold text-green-600">
                            {stat.presentDays}
                          </td>
                          <td className="p-3 text-center">
                            {stat.totalWeekdays}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`font-semibold ${
                                stat.percentage >= 75
                                  ? "text-green-600"
                                  : stat.percentage >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {stat.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-gray-500">
              No attendance records found for this student.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
