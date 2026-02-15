"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  X,
  Clock,
} from "lucide-react";

interface Room {
  _id: string;
  room_number: string;
  building: string;
}

interface Course {
  _id: string;
  course_code: string;
  course_name: string;
  instructor_name?: string;
}

interface Timetable {
  _id: string;
  room_id: {
    _id: string;
    room_number: string;
    building: string;
  };
  course_id: {
    _id: string;
    course_code: string;
    course_name: string;
    instructor_name?: string;
  };
  day: string;
  start_time: string;
  end_time: string;
}

export default function TimetableManagement() {
  const router = useRouter();
  const [timetables, setTimetables] = useState<Timetable[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTimetable, setEditingTimetable] = useState<Timetable | null>(
    null,
  );
  const [filterDay, setFilterDay] = useState<string>("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    room_id: "",
    course_id: "",
    day: "",
    start_time: "",
    end_time: "",
  });

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  useEffect(() => {
    checkAuth();
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch timetables
      const timetablesRes = await fetch("/api/admin/timetables", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!timetablesRes.ok) {
        if (timetablesRes.status === 403) {
          router.push("/home");
          return;
        }
        throw new Error("Failed to fetch timetables");
      }

      const timetablesData = await timetablesRes.json();
      setTimetables(timetablesData.timetables || []);

      // Fetch rooms
      const roomsRes = await fetch("/api/admin/rooms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const roomsData = await roomsRes.json();
      setRooms(roomsData.rooms || []);

      // Fetch courses
      const coursesRes = await fetch("/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const coursesData = await coursesRes.json();
      setCourses(coursesData.courses || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const url = editingTimetable
        ? `/api/admin/timetables/${editingTimetable._id}`
        : "/api/admin/timetables";
      const method = editingTimetable ? "PUT" : "POST";

      // Convert time strings to ISO format
      const now = new Date();
      const startDate = new Date(
        now.toDateString() + " " + formData.start_time,
      );
      const endDate = new Date(now.toDateString() + " " + formData.end_time);

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Operation failed");
      }

      setSuccess(
        editingTimetable
          ? "Timetable updated successfully"
          : "Timetable created successfully",
      );
      resetForm();
      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEdit = (timetable: Timetable) => {
    setEditingTimetable(timetable);

    // Convert ISO time to HH:MM format
    const startTime = new Date(timetable.start_time);
    const endTime = new Date(timetable.end_time);

    setFormData({
      room_id: timetable.room_id._id,
      course_id: timetable.course_id._id,
      day: timetable.day,
      start_time: startTime.toTimeString().slice(0, 5),
      end_time: endTime.toTimeString().slice(0, 5),
    });
    setShowForm(true);
  };

  const handleDelete = async (timetable: Timetable) => {
    if (
      !confirm(
        `Are you sure you want to delete this timetable entry for ${timetable.course_id.course_code}?`,
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/timetables/${timetable._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete timetable");
      }

      setSuccess("Timetable deleted successfully");
      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      room_id: "",
      course_id: "",
      day: "",
      start_time: "",
      end_time: "",
    });
    setEditingTimetable(null);
    setShowForm(false);
  };

  const filteredTimetables =
    filterDay === "all"
      ? timetables
      : timetables.filter((t) => t.day === filterDay);

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
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Timetable Management</h1>
                <p className="text-sm text-gray-400">
                  Schedule classes with rooms and time slots
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Timetable
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Alerts */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-4"
          >
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-900/20 border-green-800">
            <AlertDescription className="text-green-400">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl bg-gray-900 border-gray-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingTimetable ? "Edit Timetable" : "Add New Timetable"}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                >
                  <X className="w-5 h-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-4"
                >
                  <div>
                    <Label>Room *</Label>
                    <Select
                      value={formData.room_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, room_id: value })
                      }
                      required
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                      <SelectContent>
                        {rooms.map((room) => (
                          <SelectItem
                            key={room._id}
                            value={room._id}
                          >
                            {room.room_number} - {room.building}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Course *</Label>
                    <Select
                      value={formData.course_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, course_id: value })
                      }
                      required
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem
                            key={course._id}
                            value={course._id}
                          >
                            {course.course_code} - {course.course_name}
                            {course.instructor_name &&
                              ` (${course.instructor_name})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Day *</Label>
                    <Select
                      value={formData.day}
                      onValueChange={(value) =>
                        setFormData({ ...formData, day: value })
                      }
                      required
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day) => (
                          <SelectItem
                            key={day}
                            value={day}
                          >
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Start Time *</Label>
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            start_time: e.target.value,
                          })
                        }
                        required
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <Label>End Time *</Label>
                      <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) =>
                          setFormData({ ...formData, end_time: e.target.value })
                        }
                        required
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={resetForm}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-purple-600"
                    >
                      {editingTimetable
                        ? "Update Timetable"
                        : "Create Timetable"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter */}
        <div className="mb-6">
          <Label>Filter by Day</Label>
          <Select
            value={filterDay}
            onValueChange={setFilterDay}
          >
            <SelectTrigger className="w-64 bg-gray-900 border-gray-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {days.map((day) => (
                <SelectItem
                  key={day}
                  value={day}
                >
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Timetables by Day */}
        {days.map((day) => {
          const dayTimetables = filteredTimetables.filter((t) => t.day === day);

          if (filterDay !== "all" && filterDay !== day) return null;
          if (dayTimetables.length === 0 && filterDay !== "all") return null;

          return (
            <Card
              key={day}
              className="bg-gray-900 border-gray-800 mb-4"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {day}
                  <span className="text-sm font-normal text-gray-400">
                    ({dayTimetables.length} classes)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {dayTimetables.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    No classes scheduled for {day}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {dayTimetables
                      .sort(
                        (a, b) =>
                          new Date(a.start_time).getTime() -
                          new Date(b.start_time).getTime(),
                      )
                      .map((timetable) => {
                        const startTime = new Date(
                          timetable.start_time,
                        ).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const endTime = new Date(
                          timetable.end_time,
                        ).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <div
                            key={timetable._id}
                            className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-purple-400">
                                <Clock className="w-4 h-4" />
                                <span className="font-mono text-sm">
                                  {startTime} - {endTime}
                                </span>
                              </div>
                              <div>
                                <div className="font-semibold">
                                  {timetable.course_id.course_code} -{" "}
                                  {timetable.course_id.course_name}
                                </div>
                                <div className="text-sm text-gray-400">
                                  Room: {timetable.room_id.room_number} (
                                  {timetable.room_id.building})
                                  {timetable.course_id.instructor_name &&
                                    ` • ${timetable.course_id.instructor_name}`}
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(timetable)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(timetable)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}

        {/* Stats */}
        <div className="mt-4 text-sm text-gray-400">
          Total: {filteredTimetables.length} timetable entries
        </div>
      </div>
    </div>
  );
}
