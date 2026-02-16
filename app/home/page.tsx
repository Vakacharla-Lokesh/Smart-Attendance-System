"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Activity,
  Calendar,
  BarChart3,
  Settings,
  BookOpen,
  Clock,
  TrendingUp,
  LogOut,
  ShieldCheck,
} from "lucide-react";

interface User {
  id: string;
  email_id: string;
  enroll_no: string;
  is_admin: boolean;
  name?: string;
}

interface Stats {
  totalStudents: number;
  activeStudents: number;
  todayPunches: number;
  currentlyInside: number;
}

interface StudentStats {
  attendance_percentage: number;
  present_days: number;
  absent_days: number;
  total_days: number;
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    activeStudents: 0,
    todayPunches: 0,
    currentlyInside: 0,
  });
  const [studentStats, setStudentStats] = useState<StudentStats | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const token = localStorage.getItem("token");
      const userString = localStorage.getItem("user");

      if (!token || !userString) {
        router.push("/login");
        return;
      }

      const userData: User = JSON.parse(userString);
      setUser(userData);

      if (userData.is_admin) {
        await loadAdminStats(token);
      } else {
        await loadStudentStats(token, userData.enroll_no);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  };

  const loadAdminStats = async (token: string) => {
    try {
      const [studentsRes, punchesRes] = await Promise.all([
        fetch("/api/students", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/punch?limit=100", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (studentsRes.ok && punchesRes.ok) {
        const studentsData = await studentsRes.json();
        const punchesData = await punchesRes.json();

        const students = studentsData.data || [];
        const punches = punchesData.data || [];

        const today = new Date().toDateString();
        const todayPunches = punches.filter(
          (p: any) => new Date(p.punch_time).toDateString() === today,
        ).length;

        const studentLastPunches = new Map();
        punches.forEach((punch: any) => {
          const studentId =
            typeof punch.student_id === "object"
              ? punch.student_id._id
              : punch.student_id;
          if (!studentLastPunches.has(studentId)) {
            studentLastPunches.set(studentId, punch);
          }
        });

        const currentlyInside = Array.from(studentLastPunches.values()).filter(
          (p: any) => p.punch_type === "in",
        ).length;

        setStats({
          totalStudents: students.length,
          activeStudents: students.filter((s: any) => s.is_active).length,
          todayPunches,
          currentlyInside,
        });
      }
    } catch (error) {
      console.error("Error loading admin stats:", error);
    }
  };

  const loadStudentStats = async (token: string, enrollNo: string) => {
    try {
      const response = await fetch(`/api/attendance/student/${enrollNo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStudentStats(
          data.stats || {
            attendance_percentage: 0,
            present_days: 0,
            absent_days: 0,
            total_days: 0,
          },
        );
      }
    } catch (error) {
      console.error("Error loading student stats:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ADMIN DASHBOARD
  if (user?.is_admin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-500">Smart Attendance System</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="text-gray-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-gray-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, Administrator
            </h2>
            <p className="text-gray-600 mt-2">
              System overview and quick access to admin functions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
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
                <p className="text-sm text-green-600 mt-2">
                  {stats.activeStudents} active
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
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
                <p className="text-sm text-gray-500 mt-2">Live tracking</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium">
                  Today&apos;s Activity
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {stats.todayPunches}
                </p>
                <p className="text-sm text-gray-500 mt-2">Check-ins/outs</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium">
                  System Status
                </h3>
                <p className="text-3xl font-bold text-green-600 mt-2">Active</p>
                <p className="text-sm text-gray-500 mt-2">
                  All systems operational
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/rooms">
              <Card className="border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Room Management
                      </h3>
                      <p className="text-sm text-gray-600">
                        Configure rooms & scanners
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/courses">
              <Card className="border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Course Management
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manage courses & subjects
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/timetables">
              <Card className="border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Timetable Management
                      </h3>
                      <p className="text-sm text-gray-600">Schedule classes</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/attendance">
              <Card className="border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        View Attendance Records
                      </h3>
                      <p className="text-sm text-gray-600">
                        Monitor attendance data
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin">
              <Card className="border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Student Management
                      </h3>
                      <p className="text-sm text-gray-600">
                        Manage student accounts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="border border-gray-200 opacity-60">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-600">
                      Analytics & Reports
                    </h3>
                    <p className="text-sm text-gray-500">Coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // STUDENT DASHBOARD
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Student Portal
              </h1>
              <p className="text-sm text-gray-500">
                Welcome, {user?.name || user?.enroll_no}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-700"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
          <p className="text-gray-600 mt-2">
            Track your attendance and view your academic progress
          </p>
        </div>

        {studentStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium">
                  Attendance Rate
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {studentStats.attendance_percentage.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Overall performance
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium">
                  Present Days
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {studentStats.present_days}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Out of {studentStats.total_days} days
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium">
                  Absent Days
                </h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {studentStats.absent_days}
                </p>
                <p className="text-sm text-gray-500 mt-2">Days missed</p>
              </CardContent>
            </Card>

            <Card className="border border-gray-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-gray-600 text-sm font-medium">Status</h3>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {studentStats.attendance_percentage >= 75 ? "✓" : "!"}
                </p>
                <p
                  className={`text-sm mt-2 ${
                    studentStats.attendance_percentage >= 75
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {studentStats.attendance_percentage >= 75
                    ? "On track"
                    : "Below 75%"}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/student/portal">
            <Card className="border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      My Dashboard
                    </h3>
                    <p className="text-sm text-gray-600">
                      View detailed stats & calendar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/student/${user?.enroll_no}`}>
            <Card className="border border-gray-200 hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Attendance Calendar
                    </h3>
                    <p className="text-sm text-gray-600">
                      View monthly attendance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="border border-gray-200 opacity-60">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-600">
                    Profile Settings
                  </h3>
                  <p className="text-sm text-gray-500">Coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8 border-l-4 border-l-blue-600">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">
              📌 Attendance Information
            </h3>
            <p className="text-gray-600 text-sm">
              Your attendance is automatically recorded when you tap your RFID
              card at the scanner. Make sure to check in when entering and check
              out when leaving. Minimum 75% attendance is required for
              eligibility.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
