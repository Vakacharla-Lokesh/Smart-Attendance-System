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

  useEffect(() => {
    checkAuthAndLoadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
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
  };

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
      <div className="min-h-screen bg-background">
        <header className="bg-card text-card-foreground border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
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

        <div className="container mx-auto px-4 py-8">
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
              <Card className="border border-border hover:shadow-lg transition-all cursor-pointer">
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
              <Card className="border border-border hover:shadow-lg transition-all cursor-pointer">
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
              <Card className="border border-border hover:shadow-lg transition-all cursor-pointer">
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

  // ─── STUDENT DASHBOARD ──────────────────────────────────────────────────────

  const isPunchInAvailable = !!pendingPunch;
  const isPunchedIn = lastPunchType === "in";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card text-card-foreground border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Student Portal
              </h1>
              <p className="text-sm text-muted-foreground">
                Welcome, {user?.name || user?.enroll_no}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Welcome back!</h2>
          <p className="text-muted-foreground mt-2">
            Track your attendance and view your academic progress
          </p>
        </div>

        {/* ── ATTENDANCE ACTION CARD ────────────────────────────────────────── */}
        <Card className="border border-border mb-8 shadow-sm">
          <CardContent className="p-6">
            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">
                    Mark Your Attendance
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isPunchedIn
                      ? "You are currently punched in."
                      : "You are currently punched out."}
                  </p>
                </div>
              </div>

              {/* Manual refresh */}
              <button
                onClick={refreshPendingStatus}
                disabled={pendingLoading}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50"
              >
                {pendingLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Wifi className="w-3 h-3" />
                )}
                Refresh
              </button>
            </div>

            {/* NFC detected & Upcoming Class banner */}
            {isPunchInAvailable && pendingPunch.scheduled_class && (
              <div className="mb-4 flex items-start gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg text-purple-800 text-sm shadow-sm ring-1 ring-purple-100">
                <BookOpen className="w-5 h-5 mt-0.5 flex-shrink-0 text-purple-600" />
                <div className="flex-1 w-full">
                  <p className="font-bold text-base text-purple-900 mb-1">
                    Upcoming Class
                  </p>
                  <p className="text-sm font-medium mb-1 line-clamp-2">
                    {pendingPunch.scheduled_class.course_code} •{" "}
                    {pendingPunch.scheduled_class.course_name}
                  </p>
                  <p className="text-xs text-purple-700 flex items-center gap-1.5 mb-3 bg-card text-card-foreground/50 w-fit px-2 py-1 rounded-md border border-purple-100">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(
                      pendingPunch.scheduled_class.start_time,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -
                    <span className="ml-1">
                      {new Date(
                        pendingPunch.scheduled_class.end_time,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>

                  {/* Timer UI */}
                  {(() => {
                    const limitTime =
                      new Date(
                        pendingPunch.scheduled_class!.start_time,
                      ).getTime() +
                      5 * 60000;
                    const diff = limitTime - currentTime.getTime();

                    if (diff <= 0) {
                      return (
                        <div className="p-2.5 rounded-lg bg-red-100 border border-red-200 text-red-700 flex items-center gap-2 mt-2">
                          <XCircle className="w-4 h-4" />
                          <span className="font-semibold text-sm">
                            Late (Punch-In Window Closed)
                          </span>
                        </div>
                      );
                    }

                    const mins = Math.floor(diff / 60000);
                    const secs = Math.floor((diff % 60000) / 1000);
                    const isClosingSoon = mins < 2;
                    return (
                      <div
                        className={`p-2.5 rounded-lg border flexitems-center gap-2 mt-2 w-full transition-colors ${isClosingSoon ? "bg-orange-100 border-orange-200 text-orange-700" : "bg-green-100 border-green-200 text-green-700"}`}
                      >
                        <Clock
                          className={`w-4 h-4 ${isClosingSoon ? "animate-pulse" : ""}`}
                        />
                        <span className="font-semibold text-sm">
                          Time left to punch in: {mins}m {secs}s
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* NFC detected but NO class scheduled banner */}
            {isPunchInAvailable && !pendingPunch.scheduled_class && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                <Wifi className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">
                    NFC card detected, but no class scheduled!
                  </p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Scanner: {pendingPunch.scanner_id} &middot; Room:{" "}
                    {pendingPunch.room_id} &middot; Expires in{" "}
                    {Math.floor(pendingPunch.expires_in_seconds / 60)}m{" "}
                    {Math.floor(pendingPunch.expires_in_seconds % 60)}s
                  </p>
                </div>
              </div>
            )}

            {/* Punched in & Ongoing Class banner */}
            {isPunchedIn && lastPunch?.timetable_id && (
              <div className="mb-4 flex items-start gap-3 p-4 bg-sky-50 border border-sky-200 rounded-lg text-sky-800 text-sm shadow-sm ring-1 ring-sky-100">
                <BookOpen className="w-5 h-5 mt-0.5 flex-shrink-0 text-sky-600" />
                <div className="flex-1 w-full">
                  <p className="font-bold text-base text-sky-900 mb-1">
                    Ongoing Class
                  </p>
                  <p className="text-sm font-medium mb-1 line-clamp-2">
                    {lastPunch.course_id?.course_code} •{" "}
                    {lastPunch.course_id?.course_name}
                  </p>
                  <p className="text-xs text-sky-700 flex items-center gap-1.5 mb-3 bg-card text-card-foreground/50 w-fit px-2 py-1 rounded-md border border-sky-100">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(
                      lastPunch.timetable_id.start_time,
                    ).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -
                    <span className="ml-1">
                      {new Date(
                        lastPunch.timetable_id.end_time,
                      ).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </p>

                  {/* Timer UI for Punch Out */}
                  {(() => {
                    const endTime = new Date(
                      lastPunch.timetable_id.end_time,
                    ).getTime();
                    const maxPunchOutTime = endTime + 5 * 60000;
                    const minPunchOutTime = endTime - 15 * 60000;
                    const curr = currentTime.getTime();

                    if (curr > maxPunchOutTime) {
                      return (
                        <div className="p-2.5 rounded-lg bg-red-100 border border-red-200 text-red-700 flex items-center gap-2 mt-2">
                          <XCircle className="w-4 h-4" />
                          <span className="font-semibold text-sm">
                            Late (Punch-out Window Closed)
                          </span>
                        </div>
                      );
                    } else if (curr < minPunchOutTime) {
                      const diffStart = minPunchOutTime - curr;
                      const minsS = Math.floor(diffStart / 60000);
                      const secsS = Math.floor((diffStart % 60000) / 1000);
                      return (
                        <div className="p-2.5 rounded-lg bg-orange-100 border border-orange-200 text-orange-700 flex items-center gap-2 mt-2 w-full">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold text-sm">
                            Class ongoing. Punch out opens in: {minsS}m {secsS}
                            s.
                          </span>
                        </div>
                      );
                    }

                    const diff = maxPunchOutTime - curr;
                    const mins = Math.floor(diff / 60000);
                    const secs = Math.floor((diff % 60000) / 1000);
                    const isClosingSoon = mins < 2;
                    return (
                      <div
                        className={`p-2.5 rounded-lg border flex items-center gap-2 mt-2 w-full transition-colors ${isClosingSoon ? "bg-orange-100 border-orange-200 text-orange-700" : "bg-green-100 border-green-200 text-green-700"}`}
                      >
                        <CheckCircle
                          className={`w-4 h-4 ${isClosingSoon ? "animate-pulse" : ""}`}
                        />
                        <span className="font-semibold text-sm">
                          Time left to punch out: {mins}m {secs}s
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* No NFC banner */}
            {!isPunchInAvailable && !pendingLoading && (
              <div className="mb-4 flex items-start gap-2 p-3 bg-background border border-border rounded-lg text-muted-foreground text-sm">
                <WifiOff className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  No NFC scan detected. Tap your card at the classroom scanner,
                  then return here and click <strong>Refresh</strong> to unlock
                  Punch In.
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Punch In — only rendered when NFC entry is in Redis */}
              {isPunchInAvailable && (
                <button
                  onClick={handlePunchIn}
                  disabled={punchStatus === "loading"}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all
                    ${
                      punchStatus === "loading"
                        ? "bg-green-400 text-white cursor-not-allowed"
                        : "bg-green-500 hover:bg-green-600 active:scale-[0.98] text-white shadow-md hover:shadow-lg"
                    }`}
                >
                  {punchStatus === "loading" ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <LogIn className="w-5 h-5" />
                  )}
                  Punch In
                </button>
              )}

              {/* Punch Out — available once punched in, no location required */}
              <button
                onClick={handlePunchOut}
                disabled={punchStatus === "loading" || !isPunchedIn}
                className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold text-base transition-all
                  ${
                    !isPunchedIn
                      ? "bg-orange-50 border-2 border-orange-200 text-orange-300 cursor-not-allowed"
                      : punchStatus === "loading"
                        ? "bg-orange-400 text-white cursor-not-allowed"
                        : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white shadow-md hover:shadow-lg"
                  }`}
              >
                {punchStatus === "loading" ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LogOutIcon className="w-5 h-5" />
                )}
                {isPunchedIn ? "Punch Out" : "Not Punched In"}
              </button>
            </div>

            {/* Feedback banners */}
            {punchStatus === "success" && punchMessage && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{punchMessage}</span>
              </div>
            )}
            {punchStatus === "error" && punchError && (
              <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{punchError}</span>
              </div>
            )}

            <p className="mt-4 text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Punch In requires an NFC tap at the scanner and GPS location
              verification. Punch Out has no location requirement.
            </p>
          </CardContent>
        </Card>

        {/* ── STATS CARDS ───────────────────────────────────────────────────── */}
        {studentStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Attendance Rate
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {studentStats.attendance_percentage.toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Overall performance
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Present Days
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {studentStats.present_days}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Out of {studentStats.total_days} days
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Absent Days
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
                  {studentStats.absent_days}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Days missed
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h3 className="text-muted-foreground text-sm font-medium">
                  Status
                </h3>
                <p className="text-3xl font-bold text-foreground mt-2">
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

        {/* ── NAVIGATION CARDS ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/student/portal">
            <Card className="border border-border hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      My Dashboard
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      View detailed stats &amp; calendar
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/student/${user?.enroll_no}`}>
            <Card className="border border-border hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Attendance Calendar
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      View monthly attendance
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/student/${user?.enroll_no}/profile`}>
            <Card className="border border-border hover:shadow-lg transition-all cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Profile Settings
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your settings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <Card className="mt-8 border-l-4 border-l-blue-600">
          <CardContent className="p-6">
            <h3 className="font-semibold text-foreground mb-2">
              📌 How Attendance Works
            </h3>
            <p className="text-muted-foreground text-sm">
              Tap your NFC card at the classroom scanner — this unlocks the{" "}
              <strong>Punch In</strong> button here. Then share your location to
              verify you are in the classroom. <strong>Punch Out</strong> is
              always available once you have punched in, and does not require
              location.
            </p>
          </CardContent>
        </Card>
        {/* ── CAMERA MODAL ───────────────────────────────────────────────────── */}
        {showCamera && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="bg-card rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Take a Photo to Punch Out
                </h3>
                <button
                  onClick={() => {
                    stopCamera();
                    setShowCamera(false);
                    setCapturedImage(null);
                  }}
                  className="text-muted-foreground hover:text-foreground text-xl leading-none"
                >
                  ✕
                </button>
              </div>

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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
