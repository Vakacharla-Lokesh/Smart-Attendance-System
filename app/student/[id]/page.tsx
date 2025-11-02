"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  PieLabelRenderProps,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/* ---------- Types ---------- */
interface StudentData {
  name: string;
  enroll_number: string;
  program?: string;
  branch?: string;
  year?: string;
  photoUrl?: string;
  batch?: string;
  institute?: string;
  personal_email?: string;
  amity_email?: string;
}

interface AttendanceData {
  enroll_number: string;
  present_dates: string[]; // ISO date strings
  od_dates?: string[]; // optional: official duty dates
  total_present?: number;
}

interface MonthlyStats {
  month: string; // "YYYY-MM"
  year: number;
  monthIndex: number; // 1-12
  totalWeekdays: number;
  presentDays: number;
  odDays: number;
  percentage: number;
}

/* ---------- Helpers ---------- */
const countWeekdaysInMonth = (year: number, month: number): number => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let weekdayCount = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const d = date.getDay();
    if (d !== 0 && d !== 6) weekdayCount++;
  }
  return weekdayCount;
};

const Icon = {
  user: (props?: any) => (
    <svg
      {...props}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 12a4 4 0 100-8 4 4 0 000 8z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 20a8 8 0 0116 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  id: (props?: any) => (
    <svg
      {...props}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M7 11h10M7 15h4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  mail: (props?: any) => (
    <svg
      {...props}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M3 8.5v7a2 2 0 002 2h14a2 2 0 002-2v-7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 8.5l-9 6-9-6"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  school: (props?: any) => (
    <svg
      {...props}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 2L3 7l9 5 9-5-9-5z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 12v9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  calendar: (props?: any) => (
    <svg
      {...props}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M16 3v4M8 3v4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path
        d="M3 11h18"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  ),
  batch: (props?: any) => (
    <svg
      {...props}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.56 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"
        stroke="currentColor"
        strokeWidth="1.0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export default function StudentAnalyticsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [student, setStudent] = useState<StudentData | null>(null);
  const [attendance, setAttendance] = useState<AttendanceData | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const calculateMonthlyStats = useCallback(
    (presentDates: string[], odDates: string[] = []): MonthlyStats[] => {
      const monthMap = new Map<
        string,
        { present: Set<string>; od: Set<string>; year: number; month: number }
      >();

      const addDate = (dStr: string, setName: "present" | "od") => {
        const date = new Date(dStr);
        if (isNaN(date.getTime())) return;
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${String(month).padStart(2, "0")}`;
        if (!monthMap.has(key)) {
          monthMap.set(key, { present: new Set(), od: new Set(), year, month });
        }
        const entry = monthMap.get(key)!;
        if (setName === "present") entry.present.add(dStr);
        else entry.od.add(dStr);
      };

      presentDates.forEach((d) => addDate(d, "present"));
      (odDates || []).forEach((d) => addDate(d, "od"));

      const stats: MonthlyStats[] = [];
      monthMap.forEach((value, key) => {
        const weekdays = countWeekdaysInMonth(value.year, value.month);
        const presentDays = value.present.size;
        const odDays = value.od.size;
        const effectivePresent = presentDays;
        const percentage =
          weekdays > 0 ? ((effectivePresent + odDays) / weekdays) * 100 : 0;

        stats.push({
          month: key,
          year: value.year,
          monthIndex: value.month,
          totalWeekdays: weekdays,
          presentDays,
          odDays,
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
        // Student
        const sRes = await fetch(`/api/students/${id}`);
        if (sRes.ok) {
          const s = await sRes.json();
          setStudent(s);
        } else {
          setStudent(null);
        }

        // Attendance
        const aRes = await fetch(`/api/attendance/${id}`);
        if (aRes.ok) {
          const a = await aRes.json();
          setAttendance(a);

          const pDates = a.present_dates || [];
          const odDates = a.od_dates || [];
          const stats = calculateMonthlyStats(pDates, odDates);
          setMonthlyStats(stats);

          if (stats.length > 0) {
            setSelectedMonth(stats[0].month);
          }
        } else {
          setAttendance(null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, calculateMonthlyStats]);

  const getMonthName = (monthStr: string): string => {
    const [year, month] = monthStr.split("-");
    const d = new Date(parseInt(year), parseInt(month) - 1);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const getCurrentMonthData = () => {
    const cur = monthlyStats.find((s) => s.month === selectedMonth);
    if (!cur) return null;
    const present = cur.presentDays;
    const od = cur.odDays ?? 0;
    const absent = Math.max(cur.totalWeekdays - present - od, 0);
    return [
      { name: "Present", value: present, color: "#10b981" }, // green
      { name: "OD", value: od, color: "#f59e0b" }, // amber
      { name: "Absent", value: absent, color: "#ef4444" }, // red
    ];
  };

  const chartData = getCurrentMonthData();

  /* ---------- Compact Calendar rendering ---------- */
  const renderCalendar = (monthKey: string) => {
    const [yearStr, monStr] = monthKey.split("-");
    const year = parseInt(yearStr);
    const month = parseInt(monStr);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0..6
    const cells: (string | null)[] = Array.from({ length: firstDay }).map(
      () => null
    );
    for (let d = 1; d <= daysInMonth; d++) cells.push(String(d));
    // split into weeks
    const weeks: (string | null)[][] = [];
    while (cells.length) weeks.push(cells.splice(0, 7));

    // build lookup sets for marks
    const presentSet = new Set(
      (attendance?.present_dates || []).map((s) => {
        const dt = new Date(s);
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(dt.getDate()).padStart(2, "0")}`;
      })
    );
    const odSet = new Set(
      (attendance?.od_dates || []).map((s) => {
        const dt = new Date(s);
        return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
          2,
          "0"
        )}-${String(dt.getDate()).padStart(2, "0")}`;
      })
    );

    return (
      <div className="mt-3">
        <div className="grid grid-cols-7 gap-1 text-[11px] text-muted-foreground">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <div
              key={d}
              className="text-center"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="mt-2 space-y-1">
          {weeks.map((week, i) => (
            <div
              key={i}
              className="grid grid-cols-7 gap-1"
            >
              {week.map((day, j) => {
                if (!day)
                  return (
                    <div
                      key={j}
                      className="h-9 rounded-md bg-transparent"
                    />
                  );
                const iso = `${year}-${String(month).padStart(2, "0")}-${String(
                  day
                ).padStart(2, "0")}`;
                const isPresent = presentSet.has(iso);
                const isOd = odSet.has(iso);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const isWeekend = [0, 6].includes(
                  new Date(year, month - 1, Number(day)).getDay()
                );
                return (
                  <div
                    key={j}
                    className={`h-9 rounded-md p-1 flex flex-col justify-between items-center text-[12px]`}
                    style={{
                      border: "1px solid var(--sidebar-border)",
                      backgroundColor: isPresent
                        ? "rgba(16,185,129,0.06)"
                        : isOd
                        ? "rgba(245,158,11,0.05)"
                        : "transparent",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    <div
                      className="w-full text-center"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {day}
                    </div>
                    <div className="flex items-center gap-1">
                      {isPresent && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "#10b981" }}
                        />
                      )}
                      {isOd && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "#f59e0b" }}
                        />
                      )}
                      {!isPresent && !isOd && (
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: "#6b6b6b" }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#10b981" }}
            />{" "}
            Present
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#f59e0b" }}
            />{" "}
            OD
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: "#6b6b6b" }}
            />{" "}
            Absent
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-6"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="mb-4 flex items-center justify-between">
          <Link href="/home">
            <Button
              className="!border !border-border"
              variant="ghost"
            >
              ← Back to Home
            </Button>
          </Link>
          <div className="flex gap-2 items-center">
            <Button
              className="!bg-transparent !border !border-border"
              variant="ghost"
            >
              Export
            </Button>
            <Button className="!bg-primary !text-primary-foreground">
              Mark Attendance
            </Button>
          </div>
        </div>

        {/* top grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Student card */}
          <Card className="p-0">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-2xl">Student Profile</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex items-start gap-6">
                <div
                  className="w-24 h-24 rounded-full bg-[#121212] flex items-center justify-center overflow-hidden border"
                  style={{ borderColor: "var(--border)" }}
                >
                  {student?.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={student.photoUrl}
                      alt="avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="text-xl font-semibold"
                      style={{ color: "var(--muted-foreground)" }}
                    >
                      {student?.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("") || "N"}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {student?.name || "N/A"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {student?.program ?? "B.Tech"} •{" "}
                        {student?.branch ?? "CS"} • Year {student?.year ?? "2"}
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground text-right">
                      <div className="mb-1">
                        Batch{" "}
                        <span
                          className="font-semibold"
                          style={{ color: "var(--primary)" }}
                        >
                          {student?.batch ?? "2024"}
                        </span>
                      </div>
                      <div>
                        Institute{" "}
                        <span
                          className="font-semibold"
                          style={{ color: "var(--primary)" }}
                        >
                          {student?.institute ?? "Amity University"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div
                      className="flex items-start gap-3 p-3 rounded-md"
                      style={{
                        backgroundColor: "var(--card)",
                        color: "var(--card-foreground)",
                      }}
                    >
                      <div className="mt-0.5 text-muted-foreground">
                        <Icon.id />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Enrollment
                        </div>
                        <div className="font-semibold">
                          {student?.enroll_number || id}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-start gap-3 p-3 rounded-md"
                      style={{
                        backgroundColor: "var(--card)",
                        color: "var(--card-foreground)",
                      }}
                    >
                      <div className="mt-0.5 text-muted-foreground">
                        <Icon.calendar />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Batch
                        </div>
                        <div className="font-semibold">
                          {student?.batch ?? "2024"}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-start gap-3 p-3 rounded-md"
                      style={{
                        backgroundColor: "var(--card)",
                        color: "var(--card-foreground)",
                      }}
                    >
                      <div className="mt-0.5 text-muted-foreground">
                        <Icon.mail />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Personal Email
                        </div>
                        <div className="font-semibold text-sm">
                          {student?.personal_email ?? "student@example.com"}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-start gap-3 p-3 rounded-md"
                      style={{
                        backgroundColor: "var(--card)",
                        color: "var(--card-foreground)",
                      }}
                    >
                      <div className="mt-0.5 text-muted-foreground">
                        <Icon.mail />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Amity Email
                        </div>
                        <div className="font-semibold text-sm">
                          {student?.amity_email ?? "student@amity.edu"}
                        </div>
                      </div>
                    </div>

                    <div
                      className="flex items-start gap-3 p-3 rounded-md col-span-2"
                      style={{
                        backgroundColor: "var(--card)",
                        color: "var(--card-foreground)",
                      }}
                    >
                      <div className="mt-0.5 text-muted-foreground">
                        <Icon.school />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Institute
                        </div>
                        <div className="font-semibold">
                          {student?.institute ?? "Amity University"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-primary mb-3">
                      7th Semester Subjects
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-foreground">
                      <li>IoT System Design and Hardware</li>
                      <li>Blockchain Technologies</li>
                      <li>Applied Cryptography</li>
                      <li>Cybersecurity</li>
                      <li>SKE (Professional Programming Skills)</li>
                      <li>French</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Large monthly card with compact calendar */}
          <Card className="col-span-1 lg:col-span-2">
            <CardHeader className="px-6 py-4">
              <CardTitle className="text-2xl">Monthly Attendance</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="flex items-start justify-between gap-6 flex-col lg:flex-row">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {monthlyStats.length > 0 ? (
                      monthlyStats.map((s) => (
                        <Button
                          key={s.month}
                          onClick={() => setSelectedMonth(s.month)}
                          className={`${
                            selectedMonth === s.month
                              ? "!bg-primary !text-primary-foreground"
                              : ""
                          }`}
                          variant={
                            selectedMonth === s.month ? "default" : "outline"
                          }
                        >
                          {getMonthName(s.month)}
                        </Button>
                      ))
                    ) : (
                      <div className="text-muted-foreground">
                        No months available
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div
                      className="bg-transparent p-3 rounded-md"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      {chartData ? (
                        <div className="h-48">
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                          >
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                innerRadius={36}
                                paddingAngle={4}
                                dataKey="value"
                                label={(p: PieLabelRenderProps) =>
                                  `${p.name}: ${p.value}`
                                }
                                labelLine={false}
                              >
                                {chartData.map((entry, idx) => (
                                  <Cell
                                    key={idx}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-muted-foreground">
                          No chart data
                        </div>
                      )}
                    </div>

                    <div
                      className="p-3 rounded-md"
                      style={{ border: "1px solid var(--border)" }}
                    >
                      <h4 className="font-semibold text-lg">
                        {getMonthName(
                          selectedMonth || monthlyStats[0]?.month || ""
                        )}
                      </h4>
                      <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {monthlyStats
                          .filter((s) => s.month === selectedMonth)
                          .map((s) => (
                            <div key={s.month}>
                              <div className="flex items-center justify-between">
                                <span>Total Weekdays</span>
                                <span className="font-semibold">
                                  {s.totalWeekdays}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Present</span>
                                <span className="font-semibold text-green-400">
                                  {s.presentDays}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>OD</span>
                                <span className="font-semibold text-amber-400">
                                  {s.odDays}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Absent</span>
                                <span className="font-semibold text-red-400">
                                  {Math.max(
                                    s.totalWeekdays - s.presentDays - s.odDays,
                                    0
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Attendance %</span>
                                <span className="font-semibold">
                                  {s.percentage}%
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>

                      {/* Compact calendar preview */}
                      {selectedMonth && (
                        <div className="mt-3">
                          {renderCalendar(selectedMonth)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* lower grid: overview + assessments */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="px-6 py-4">
              <CardTitle>All Months Overview</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: "var(--card)" }}>
                    <tr>
                      <th className="p-3 text-left">Month</th>
                      <th className="p-3 text-center">Present</th>
                      <th className="p-3 text-center">OD</th>
                      <th className="p-3 text-center">Total Weekdays</th>
                      <th className="p-3 text-center">Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {monthlyStats.length ? (
                      monthlyStats.map((stat) => (
                        <tr
                          key={stat.month}
                          className="border-b"
                        >
                          <td className="p-3">{getMonthName(stat.month)}</td>
                          <td className="p-3 text-center text-green-400 font-semibold">
                            {stat.presentDays}
                          </td>
                          <td className="p-3 text-center text-amber-400 font-semibold">
                            {stat.odDays}
                          </td>
                          <td className="p-3 text-center">
                            {stat.totalWeekdays}
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`${
                                stat.percentage >= 75
                                  ? "text-green-400"
                                  : stat.percentage >= 50
                                  ? "text-yellow-400"
                                  : "text-red-400"
                              } font-semibold`}
                            >
                              {stat.percentage}%
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-6 text-center text-muted-foreground"
                        >
                          No data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="px-6 py-4">
              <CardTitle>Assessments & Grades</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Theory Assessment
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      disabled
                      value="85 / 100"
                      className="w-full rounded-md p-2 bg-transparent border"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                    <Button className="!bg-primary !text-primary-foreground">
                      Edit
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Practical
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      disabled
                      value="45 / 50"
                      className="w-full rounded-md p-2 bg-transparent border"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--foreground)",
                      }}
                    />
                    <Button className="!bg-primary !text-primary-foreground">
                      Edit
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground">
                    Attendance Weight
                  </label>
                  <div className="mt-2">
                    <div className="text-sm">
                      Computed attendance contribution to final grade:{" "}
                      <span className="font-semibold">4.35%</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Button className="w-full !bg-primary !text-primary-foreground">
                    Save (non-functional)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
