"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, FileDown, BookOpen } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Page() {
  const router = useRouter(); // ADD THIS

  // ADD THIS AUTHENTICATION CHECK
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);
  
  const attendanceData = [
    { name: "Present", value: 21, color: "#9b5de5" },
    { name: "Absent", value: 4, color: "#ff6b6b" },
    { name: "OD", value: 2, color: "#f1c40f" },
  ];

  const weeklyData = [
    { day: "Mon", attendance: 90 },
    { day: "Tue", attendance: 80 },
    { day: "Wed", attendance: 85 },
    { day: "Thu", attendance: 95 },
    { day: "Fri", attendance: 88 },
  ];

  return (
    <div className="flex bg-gradient-to-b from-gray-900 to-black text-white min-h-screen overflow-y-auto">
      {/* ---------- LEFT MAIN SECTION ---------- */}
      <div className="flex-1 p-8 space-y-8">
        {/* ---------- NAVBAR ---------- */}
        <div className="mb-4 flex items-center justify-between">
          <Link href="/home">
            <Button
              variant="ghost"
              className="!border !border-gray-700 text-gray-300 hover:!bg-purple-600 hover:!text-white transition-all"
            >
              ← Back to Home
            </Button>
          </Link>

          <div className="flex gap-2 items-center">
            <Button className="!bg-purple-600 hover:!bg-purple-700 !text-white font-medium transition-all">
              Help
            </Button>
          </div>
        </div>

        {/* ---------- STUDENT PROFILE ---------- */}
        <div className="bg-gray-900/60 p-6 rounded-2xl shadow-lg border border-gray-800 flex flex-col md:flex-row gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-semibold">
              AM
            </div>
            <div>
              <h1 className="text-2xl font-bold">Aarav Mehta</h1>
              <p className="text-gray-400">B.Tech • CS • Year 2</p>
              <p className="text-purple-400">Amity University</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 flex-1 text-gray-300 mt-4 md:mt-0">
            <div>
              <p className="text-sm text-gray-400">Enrollment</p>
              <p className="font-semibold">ENR1001</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Batch</p>
              <p className="font-semibold">2024</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Personal Email</p>
              <p className="font-semibold">student@example.com</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Amity Email</p>
              <p className="font-semibold">student@amity.edu</p>
            </div>
          </div>
        </div>

        {/* ---------- ATTENDANCE SECTION ---------- */}
        <div className="bg-gray-900/60 p-6 rounded-2xl shadow-lg border border-gray-800">
          <h2 className="text-2xl font-bold mb-4">Monthly Attendance</h2>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Donut Chart */}
            <div className="flex justify-center items-center">
              <ResponsiveContainer
                width="100%"
                height={200}
              >
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-center space-y-2 text-gray-300">
              {attendanceData.map((item) => (
                <p key={item.name}>
                  <span
                    className="inline-block w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  {item.name}:{" "}
                  <span className="font-semibold">{item.value}</span>
                </p>
              ))}
              <p className="mt-3 text-purple-400 font-semibold">
                Overall Attendance: 91%
              </p>
            </div>

            {/* Subject List Section */}
            <div className="ml-10 border-l border-gray-700 pl-6 text-gray-200">
              <h2 className="text-lg font-semibold text-purple-400 mb-3">
                📘 Subjects Enrolled
              </h2>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>IoT System and Hardware</span>
                  <span className="text-purple-400">CSE11</span>
                </li>
                <li className="flex justify-between">
                  <span>Blockchain Technologies</span>
                  <span className="text-purple-400">CSE12</span>
                </li>
                <li className="flex justify-between">
                  <span>Cryptography for Cybersecurity</span>
                  <span className="text-purple-400">CSE13</span>
                </li>
                <li className="flex justify-between">
                  <span>Professional Ethics</span>
                  <span className="text-purple-400">CSE14</span>
                </li>
                <li className="flex justify-between">
                  <span>French</span>
                  <span className="text-purple-400">FRN15</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-2">
              Weekly Attendance Trend
            </h3>
            <ResponsiveContainer
              width="100%"
              height={200}
            >
              <BarChart data={weeklyData}>
                <XAxis
                  dataKey="day"
                  stroke="#aaa"
                />
                <YAxis stroke="#aaa" />
                <Tooltip />
                <Bar
                  dataKey="attendance"
                  fill="#9b5de5"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---------- EXAMS + TIMETABLE ---------- */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Exam Section */}
          <div className="bg-gray-900/60 p-6 rounded-2xl shadow-lg border border-gray-800">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-purple-400">
              <BookOpen className="w-5 h-5" /> Upcoming Examinations
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li>
                📘 IoT System Design -{" "}
                <span className="text-purple-400">5 Nov</span>
              </li>
              <li>
                🔐 Applied Cryptography -{" "}
                <span className="text-purple-400">9 Nov</span>
              </li>
              <li>
                🧠 Blockchain Technologies -{" "}
                <span className="text-purple-400">12 Nov</span>
              </li>
            </ul>
          </div>

          {/* Daily Timetable */}
          <div className="bg-gray-900/60 p-6 rounded-2xl shadow-lg border border-gray-800">
            <h2 className="text-xl font-bold mb-3 flex items-center gap-2 text-purple-400">
              <CalendarClock className="w-5 h-5" /> Today’s Timetable
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li>09:00 AM - IoT System Design (Room 201)</li>
              <li>11:00 AM - Cybersecurity (Lab 2)</li>
              <li>02:00 PM - Blockchain Tech (Room 304)</li>
            </ul>
          </div>
        </div>

        {/* ---------- DOWNLOAD SYLLABUS ---------- */}
        <div className="text-center mt-6">
          <button className="px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-semibold shadow-md transition">
            <FileDown className="inline mr-2 w-5 h-5" /> Download Syllabus
          </button>
        </div>
      </div>

      {/* ---------- RIGHT SIDEBAR ---------- */}
      <div className="w-[320px] bg-gray-950/70 backdrop-blur-xl p-6 border-l border-gray-800 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Bell className="text-purple-400" /> Notifications
          </h2>
          <div className="space-y-3">
            <Notification
              title="🧾 Fee Payment Due"
              desc="Last date for Semester 7 payment: Nov 15"
            />
            <Notification
              title="🧠 Exam Reminder"
              desc="IoT Design exam on Nov 5 at 10:00 AM"
            />
            <Notification
              title="💡 Campus Update"
              desc="Hackathon 2025 registrations are open!"
            />
          </div>

          {/* Small Fees Card */}
          <div className="mt-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700 shadow-md">
            <h3 className="text-purple-400 font-semibold mb-2">Fees Status</h3>
            <p className="text-sm text-gray-300">
              Status: <span className="text-green-400 font-semibold">Paid</span>
            </p>
            <p className="text-sm text-gray-300">
              Last Payment: <span className="font-semibold">Aug 2025</span>
            </p>
            <button className="mt-3 w-full py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-semibold">
              <FileDown className="inline w-4 h-4 mr-2" /> Download Receipt
            </button>
          </div>
        </div>

        <div className="text-center text-gray-500 text-sm mt-6">
          © 2025 Student Portal
        </div>
      </div>
    </div>
  );
}

/* ---------- REUSABLE COMPONENT ---------- */
function Notification({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-gray-800/50 hover:bg-gray-800/70 transition rounded-xl p-4 shadow-sm cursor-pointer">
      <h3 className="font-semibold text-purple-400">{title}</h3>
      <p className="text-gray-300 text-sm mt-1">{desc}</p>
    </div>
  );
}
