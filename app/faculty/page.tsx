"use client";
import React from "react";
import {
  ClipboardList,
  Users,
  BarChart3,
  CalendarClock,
  Bell,
} from "lucide-react";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-900 to-black text-white overflow-hidden">
      {/* Left Main Section */}
      <div className="flex-1 p-8 grid grid-rows-[auto,1fr,auto] gap-6">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              👋 Welcome,{" "}
              <span className="text-rose-400">Dr. S.K. Chaudhry</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Manage attendance, courses, and student details effortlessly.
            </p>
          </div>

          {/* Quick Info */}
          <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
            <div className="bg-gray-800/60 backdrop-blur-xl p-4 rounded-2xl text-center shadow-md min-w-[140px]">
              <p className="text-sm text-gray-400">Courses</p>
              <p className="text-lg font-semibold text-rose-400">
                IoT 401, CS 305
              </p>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl p-4 rounded-2xl text-center shadow-md min-w-[120px]">
              <p className="text-sm text-gray-400">Students</p>
              <p className="text-lg font-semibold">120+</p>
            </div>
            <div className="bg-gray-800/60 backdrop-blur-xl p-4 rounded-2xl text-center shadow-md min-w-[150px]">
              <p className="text-sm text-gray-400">Avg Attendance</p>
              <p className="text-lg font-semibold text-green-400">92%</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          <ActionCard
            icon={<ClipboardList />}
            link="/home"
            title="Mark Attendance"
          />
          <ActionCard
            icon={<Users />}
            title="View Students"
          />
          <ActionCard
            icon={<BarChart3 />}
            title="Reports / Analytics"
          />
        </div>

        {/* Quick Schedule Panel */}
        <div className="mt-6 bg-gray-800/40 backdrop-blur-lg p-6 rounded-2xl shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-rose-400">
            <CalendarClock className="w-5 h-5" /> Today’s Schedule
          </h2>
          <div className="space-y-3 text-gray-300">
            <ScheduleItem
              time="09:30 AM"
              subject="IoT 401"
              room="Room 205"
            />
            <ScheduleItem
              time="11:00 AM"
              subject="Cyber Security 305"
              room="Lab 3"
            />
            <ScheduleItem
              time="02:00 PM"
              subject="Project Mentoring"
              room="Seminar Hall"
            />
          </div>
          <div className="flex gap-4 mt-5">
            <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-sm font-semibold transition">
              + Add Class
            </button>
            <button className="px-4 py-2 border border-rose-500 hover:bg-rose-600/10 rounded-lg text-sm font-semibold transition">
              Reschedule
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Announcements */}
      <div className="w-[320px] bg-gray-950/70 backdrop-blur-xl p-6 border-l border-gray-800 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Bell className="text-rose-400" /> Announcements
          </h2>
          <div className="space-y-3">
            <Announcement
              title="🎓 New Student Added"
              desc="B.Tech IoT - Section A has a new member enrolled."
            />
            <Announcement
              title="🕒 Attendance Reminder"
              desc="You have a class at 10:30 AM for IoT 401."
            />
            <Announcement
              title="⚙️ System Update"
              desc="Portal maintenance scheduled for Sunday night."
            />
          </div>
        </div>

        <div className="text-center mt-6 text-gray-500 text-sm">
          © 2025 Faculty Portal
        </div>
      </div>
    </div>
  );
}

/* ---------- Reusable Components ---------- */

function ActionCard({
  icon,
  title,
  link = "",
}: {
  icon: React.ReactNode;
  title: string;
  link?: string;
}) {
  return (
    <Link href={link}>
      <div className="bg-gray-800/40 hover:bg-gray-800/70 transition-all backdrop-blur-lg rounded-2xl p-6 flex flex-col items-center justify-center shadow-md hover:scale-[1.03] cursor-pointer">
        <div className="text-3xl text-rose-400 mb-3">{icon}</div>
        <h2 className="text-lg font-semibold text-center">{title}</h2>
      </div>
    </Link>
  );
}

function ScheduleItem({
  time,
  subject,
  room,
}: {
  time: string;
  subject: string;
  room: string;
}) {
  return (
    <div className="flex items-center justify-between bg-gray-900/40 hover:bg-gray-800/60 transition rounded-xl p-3">
      <div className="flex flex-col">
        <span className="text-white font-medium">{subject}</span>
        <span className="text-gray-400 text-sm">{room}</span>
      </div>
      <span className="text-rose-400 font-semibold text-sm">{time}</span>
    </div>
  );
}

function Announcement({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-gray-800/50 hover:bg-gray-800/70 transition rounded-xl p-4 shadow-sm cursor-pointer">
      <h3 className="font-semibold text-rose-400">{title}</h3>
      <p className="text-gray-300 text-sm mt-1">{desc}</p>
    </div>
  );
}
