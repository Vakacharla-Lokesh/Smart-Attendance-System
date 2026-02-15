"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Calendar,
  BookOpen,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_rooms: 0,
    total_courses: 0,
    total_timetables: 0,
    total_students: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push("/login");
      return;
    }

    // Check if user is admin
    const userData = JSON.parse(user);
    if (!userData.is_admin) {
      router.push("/home");
      return;
    }

    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch rooms count
      const roomsRes = await fetch("/api/admin/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const roomsData = await roomsRes.json();

      // Fetch courses count
      const coursesRes = await fetch("/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const coursesData = await coursesRes.json();

      // Fetch timetables count
      const timetablesRes = await fetch("/api/admin/timetables", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const timetablesData = await timetablesRes.json();

      setStats({
        total_rooms: roomsData.rooms?.length || 0,
        total_courses: coursesData.courses?.length || 0,
        total_timetables: timetablesData.timetables?.length || 0,
        total_students: 0, // Add students API if needed
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-lg text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-gray-400">
                Smart Attendance Management System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/home">
              <Button
                variant="ghost"
                className="text-gray-300"
              >
                Home
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Rooms</p>
                  <p className="text-3xl font-bold mt-1">{stats.total_rooms}</p>
                </div>
                <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Courses</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.total_courses}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Timetable Entries</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.total_timetables}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Students</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats.total_students}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/rooms">
            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-500" />
                  </div>
                  <CardTitle>Room Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">
                  Add, edit, and manage classroom locations with geofence
                  settings
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/courses">
            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle>Course Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">
                  Create and manage courses, assign instructors and credits
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/timetables">
            <Card className="bg-gray-900 border-gray-800 hover:bg-gray-800 transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-purple-500" />
                  </div>
                  <CardTitle>Timetable Management</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm">
                  Schedule classes by assigning rooms, courses, and time slots
                </p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-gray-900 border-gray-800 opacity-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-yellow-500" />
                </div>
                <CardTitle>Student Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Coming soon: Manage student accounts and permissions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800 opacity-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-red-500" />
                </div>
                <CardTitle>Analytics & Reports</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm">
                Coming soon: View attendance statistics and generate reports
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
