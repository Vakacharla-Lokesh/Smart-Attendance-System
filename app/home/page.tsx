"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  Wifi,
  WifiOff,
  LogIn,
  LogOut as LogOutIcon,
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

interface PendingPunch {
  room_id: string;
  scanner_id: string;
  scanned_at: string;
  expires_in_seconds: number;
  scheduled_class?: {
    _id: string;
    start_time: string;
    end_time: string;
    course_code: string;
    course_name: string;
  } | null;
}

type PunchStatus = "idle" | "loading" | "success" | "error";

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

  // NFC / Redis queue state
  const [pendingPunch, setPendingPunch] = useState<PendingPunch | null>(null);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Last punch status (for punch-out gating)
  const [lastPunchType, setLastPunchType] = useState<"in" | "out" | null>(null);
  const [lastPunch, setLastPunch] = useState<any>(null);

  // Current time for late timer calculations
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Action feedback
  const [punchStatus, setPunchStatus] = useState<PunchStatus>("idle");
  const [punchMessage, setPunchMessage] = useState("");
  const [punchError, setPunchError] = useState("");

  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Hit GET /api/attendance/pending — returns has_pending: true only if
   * this student's NFC tap is sitting in the Upstash Redis queue.
   * Punch In button only renders when this is true.
   */
  const checkPendingPunch = useCallback(async (token: string) => {
    setPendingLoading(true);
    try {
      const res = await fetch("/api/attendance/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setPendingPunch(null);
        return;
      }
      const data = await res.json();
      setPendingPunch(data.has_pending ? data.pending_scan : null);
    } catch {
      setPendingPunch(null);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const checkAuthAndLoadData = useCallback(async () => {
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
        await Promise.all([
          loadStudentStats(token, userData.enroll_no),
          checkPendingPunch(token),
          fetchLastPunchType(token),
        ]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading data:", error);
      setLoading(false);
    }
  }, [checkPendingPunch, router]);

  /** Fetch most recent punch to determine punch-out eligibility */
  const fetchLastPunchType = async (token: string) => {
    try {
      const res = await fetch("/api/punch?limit=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      const punches = data.data || [];
      if (punches.length > 0) {
        setLastPunch(punches[0]);
        setLastPunchType(punches[0].punch_type as "in" | "out");
      }
    } catch {
      // non-critical
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
      const response = await fetch(`/api/attendance/${enrollNo}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      // Set stats whether response is ok or not (empty stats for new students)
      setStudentStats(
        data.stats || {
          attendance_percentage: 0,
          present_days: 0,
          absent_days: 0,
          total_days: 0,
        },
      );
    } catch (error) {
      console.error("Error loading student stats:", error);
      // Set default stats to prevent empty UI
      setStudentStats({
        attendance_percentage: 0,
        present_days: 0,
        absent_days: 0,
        total_days: 0,
      });
    }
  };

  useEffect(() => {
    checkAuthAndLoadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [checkAuthAndLoadData]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  // ─── Punch In ───────────────────────────────────────────────────────────────
  // Only callable when pendingPunch !== null (NFC entry exists in Redis)
  // Sends GPS coords to POST /api/attendance/pending which:
  //   1. Verifies location against the room
  //   2. Marks attendance in MongoDB
  //   3. Removes the entry from Redis

  const handlePunchIn = () => {
    if (!pendingPunch) return;

    setPunchStatus("loading");
    setPunchMessage("");
    setPunchError("");

    if (!navigator.geolocation) {
      setPunchStatus("error");
      setPunchError("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        await submitPunchIn(latitude, longitude);
      },
      (err) => {
        setPunchStatus("error");
        setPunchError(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Please allow location to punch in."
            : "Unable to retrieve your location. Please try again.",
        );
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const submitPunchIn = async (latitude: number, longitude: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/punch/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ punch_type: "in", latitude, longitude }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPunchStatus("error");
        setPunchError(
          data.error ||
          data.message ||
          "Punch in failed. You may be too far from the classroom.",
        );
        return;
      }

      setPunchStatus("success");
      setPunchMessage(
        "✅ Punched in successfully! Attendance has been recorded.",
      );
      setPendingPunch(null); // Redis entry consumed — hide Punch In
      setLastPunchType("in");

      await loadStudentStats(token, user!.enroll_no);

      setTimeout(() => {
        setPunchStatus("idle");
        setPunchMessage("");
      }, 5000);
    } catch {
      setPunchStatus("error");
      setPunchError(
        "Network error. Please check your connection and try again.",
      );
    }
  };

  const openCamera = async () => {
    setShowCamera(true);
    setCapturedImage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      // Wait a tick for the video element to mount
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      setPunchStatus("error");
      setPunchError("Camera access denied. Please allow camera to punch out.");
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")!.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retakePhoto = async () => {
    setCapturedImage(null);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
    });
    streamRef.current = stream;
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    }, 100);
  };

  // ─── Punch Out ──────────────────────────────────────────────────────────────
  // Available whenever lastPunchType === "in". No location needed.

  const handlePunchOut = () => {
    // Step 1: open camera modal — actual API call happens after photo is taken
    openCamera();
  };

  const submitPunchOut = async (imageBase64: string) => {
    setShowCamera(false);
    stopCamera();
    setPunchStatus("loading");
    setPunchMessage("");
    setPunchError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/punch/manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ punch_type: "out", image_base64: imageBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPunchStatus("error");
        setPunchError(data.error || "Punch out failed. Please try again.");
        return;
      }

      setPunchStatus("success");
      setPunchMessage(
        data.data?.attendance_marked
          ? "✅ Punched out! Attendance marked for today."
          : "✅ Punched out successfully.",
      );
      setLastPunchType("out");
      setCapturedImage(null);
      await loadStudentStats(token, user!.enroll_no);
      setTimeout(() => {
        setPunchStatus("idle");
        setPunchMessage("");
      }, 5000);
    } catch {
      setPunchStatus("error");
      setPunchError(
        "Network error. Please check your connection and try again.",
      );
    }
  };

  const refreshPendingStatus = () => {
    const token = localStorage.getItem("token");
    if (token) checkPendingPunch(token);
  };

  // ─── Loading ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // ─── ADMIN DASHBOARD ────────────────────────────────────────────────────────

  if (user?.is_admin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Smart Attendance System
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button
                  variant="ghost"
                  className="text-foreground"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-10 max-w-7xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground">
              Welcome back, Administrator
            </h2>
            <p className="text-muted-foreground mt-2">
              System overview and quick access to admin functions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Total Students
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stats.totalStudents}
                </p>
                <p className="text-sm text-green-600 mt-2">
                  {stats.activeStudents} active
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Activity className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Currently Inside
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stats.currentlyInside}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Students on campus
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Today&apos;s Punches
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stats.todayPunches}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Total check-ins/outs
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Attendance Rate
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {stats.totalStudents > 0
                    ? Math.round(
                      (stats.currentlyInside / stats.totalStudents) * 100,
                    )
                    : 0}
                  %
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Current presence
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard">
              <Card className="border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Live Dashboard
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Real-time attendance monitoring
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/attendance">
              <Card className="border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        View Attendance Records
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Monitor attendance data
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin">
              <Card className="border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300 transition-all cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">
                        Student Management
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Manage student accounts
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="border border-border opacity-60">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-muted-foreground">
                      Analytics &amp; Reports
                    </h3>
                    <p className="text-sm text-muted-foreground">Coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  {/* ─── STUDENT DASHBOARD ────────────────────────────────────────────────────── */ }

  const isPunchInAvailable = !!pendingPunch;
  const isPunchedIn = lastPunchType === "in";

  return (
    <div className="h-screen flex bg-[#020617] text-white overflow-hidden">

      {/* ─── SIDEBAR ───────────────────────────────────────── */}

      <div className="w-64 bg-[#0f172a] border-r border-white/10 flex flex-col justify-between">

        <div>

          {/* PROFILE */}
          <div className="px-6 py-6 border-b border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold">
                {user?.name?.charAt(0) || "S"}
              </div>

              <div>
                <p className="text-sm font-semibold">{user?.name || "Student"}</p>
                <p className="text-xs text-white/50">{user?.enroll_no}</p>
              </div>
            </div>

            <div className="text-xs space-y-1 text-white/60">
              <p>📍 Status: {lastPunchType === "in" ? "Inside Campus" : "Outside"}</p>
              <p>📅 {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          {/* NAV */}
          <div className="p-4 space-y-2">
            <Link href="/student/portal">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 text-emerald-400">
                <BookOpen className="w-4 h-4" /> Dashboard
              </div>
            </Link>

            <Link href={`/student/${user?.enroll_no}`}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition">
                <Calendar className="w-4 h-4" /> Attendance
              </div>
            </Link>

            <Link href={`/student/${user?.enroll_no}/profile`}>
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition">
                <Settings className="w-4 h-4" /> Profile
              </div>
            </Link>
          </div>

          {/* NOTIFICATIONS */}
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs text-white/50 mb-2">Notifications</p>

            <div className="bg-white/5 p-3 rounded-lg text-xs border border-white/10">
              ⚠ Attendance below 75%
            </div>

            <div className="bg-white/5 p-3 rounded-lg text-xs border border-white/10">
              📢 Assignment due tomorrow
            </div>
          </div>

        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="m-4 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-red-500 hover:bg-red-600 transition"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>

      </div>


      {/* ─── MAIN ───────────────────────────────────────── */}

      <div className="flex-1 flex flex-col px-8 py-6 gap-6 overflow-hidden">

        {/* TOP GRID */}
        <div className="grid grid-cols-2 gap-6">

          {/* STUDENT INFO */}
          <Card className="bg-[#0f172a] border border-white/10 text-white">
            <CardContent className="p-6">

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-lg bg-emerald-500/20 flex items-center justify-center text-lg font-bold text-emerald-400">
                  {user?.name?.charAt(0) || "S"}
                </div>

                <div>
                  <h2 className="text-xl font-semibold">{user?.name || "Student"}</h2>
                  <p className="text-sm text-white/50">Enrollment: {user?.enroll_no}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-white/50">Branch</p>
                  <p className="font-medium">Computer Science</p>
                </div>

                <div>
                  <p className="text-white/50">Year</p>
                  <p className="font-medium">3rd Year</p>
                </div>

                <div>
                  <p className="text-white/50">Section</p>
                  <p className="font-medium">A</p>
                </div>

                <div>
                  <p className="text-white/50">Status</p>
                  <p className="text-emerald-400 font-medium">Active</p>
                </div>
              </div>

            </CardContent>
          </Card>


          {/* ATTENDANCE ACTION */}
          <Card className="bg-[#0f172a] border border-white/10 text-white">
            <CardContent className="p-6">

              <div className="flex justify-between items-center mb-5">
                <div>
                  <p className="font-semibold">Attendance</p>
                  <p className="text-sm text-white/50">
                    {isPunchedIn ? "Currently Punched In" : "Currently Punched Out"}
                  </p>
                </div>

                <button
                  onClick={refreshPendingStatus}
                  disabled={pendingLoading}
                  className="text-sm text-emerald-400 flex items-center gap-1"
                >
                  {pendingLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Wifi className="w-4 h-4" />}
                  Refresh
                </button>
              </div>

              <div className="flex gap-4">
                {isPunchInAvailable && (
                  <button
                    onClick={handlePunchIn}
                    disabled={punchStatus === "loading"}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 py-3 rounded-lg font-medium"
                  >
                    {punchStatus === "loading"
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <LogIn className="w-4 h-4" />}
                    Punch In
                  </button>
                )}

                <button
                  onClick={handlePunchOut}
                  disabled={!isPunchedIn || punchStatus === "loading"}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium
                    ${!isPunchedIn
                      ? "bg-white/10 text-white/40"
                      : "bg-orange-500 hover:bg-orange-600"}
`}
                >
                  {punchStatus === "loading"
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <LogOutIcon className="w-4 h-4" />}
                  {isPunchedIn ? "Punch Out" : "Not Available"}
                </button>
              </div>

            </CardContent>
          </Card>

        </div>


        {/* STATS (BACK TO MAIN) */}
        {studentStats && (
          <div className="grid grid-cols-4 gap-6">

            <Card className="bg-[#0f172a] border border-white/10 text-white p-5">
              <p className="text-sm text-white/50">Attendance %</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {studentStats.attendance_percentage.toFixed(1)}%
              </p>
            </Card>

            <Card className="bg-[#0f172a] border border-white/10 text-white p-5">
              <p className="text-sm text-white/50">Present</p>
              <p className="text-2xl font-bold mt-1">
                {studentStats.present_days}
              </p>
            </Card>

            <Card className="bg-[#0f172a] border border-white/10 text-white p-5">
              <p className="text-sm text-white/50">Absent</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                {studentStats.absent_days}
              </p>
            </Card>

            <Card className="bg-[#0f172a] border border-white/10 text-white p-5">
              <p className="text-sm text-white/50">Status</p>
              <p className="text-md font-semibold mt-1">
                {studentStats.attendance_percentage >= 75 ? "On Track" : "Below 75%"}
              </p>
            </Card>

          </div>
        )}


        {/* LOWER GRID */}
        <div className="grid grid-cols-2 gap-6">

          {/* SUBJECTS (7 TOTAL) */}
          <Card className="bg-[#0f172a] border border-white/10 text-white">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Subjects</h3>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <span>Data Structures</span>
                <span>Web Development</span>
                <span>Operating Systems</span>
                <span>DBMS</span>
                <span>Computer Networks</span>
                <span>Software Engineering</span>
                <span>AI / ML</span>
              </div>

            </CardContent>
          </Card>


          {/* ASSIGNMENTS */}
          <Card className="bg-[#0f172a] border border-white/10 text-white">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Assignments</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>DSA Sheet</span>
                  <span className="text-red-400">Tomorrow</span>
                </div>

                <div className="flex justify-between">
                  <span>Web Project</span>
                  <span className="text-yellow-400">2 days</span>
                </div>

                <div className="flex justify-between">
                  <span>OS Notes</span>
                  <span className="text-emerald-400">Done</span>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

      </div>

      {showCamera && (
        <div className="p-4 flex flex-col items-center gap-4">
          {!capturedImage ? (
            <>
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
              </div>
              <button
                onClick={capturePhoto}
                className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-base transition-all shadow-md"
              >
                📸 Capture Photo
              </button>
            </>
          ) : (
            <>
              <div className="w-full aspect-video bg-black rounded-xl overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={capturedImage}
                  className="w-full h-full object-cover"
                  alt="Captured"
                />
              </div>
              <div className="flex gap-3 w-full">
                <button
                  onClick={retakePhoto}
                  className="flex-1 py-3 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-muted transition-all"
                >
                  Retake
                </button>
                <button
                  onClick={() => submitPunchOut(capturedImage)}
                  disabled={punchStatus === "loading"}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm transition-all shadow-md disabled:opacity-60"
                >
                  {punchStatus === "loading"
                    ? "Submitting…"
                    : "Confirm & Punch Out"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}