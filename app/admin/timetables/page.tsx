"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Plus, Edit, Trash2, X } from "lucide-react";

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
  const [adminName, setAdminName] = useState("Admin User");
  const [adminEmail, setAdminEmail] = useState("admin@university.edu");

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
  ];

  const timeSlots = [
    { label: "09:00 AM - 10:00 AM", start: "09:00", end: "10:00" },
    { label: "10:00 AM - 11:00 AM", start: "10:00", end: "11:00" },
    { label: "11:00 AM - 12:00 AM", start: "11:00", end: "12:00" },
    { label: "12:00 PM - 01:00 PM", start: "12:00", end: "13:00" },
    { label: "01:00 PM - 02:00 PM", start: "13:00", end: "14:00" },
  ];

  useEffect(() => {
    checkAuth();
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token) {
      router.push("/login");
      return;
    }

    // Set admin info
    if (user) {
      const userData = JSON.parse(user);
      setAdminName(userData.name || "Admin User");
      setAdminEmail(userData.email || "admin@university.edu");
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

  const handleAddForSlot = (day: string, start: string, end: string) => {
    setFormData({
      room_id: "",
      course_id: "",
      day: day,
      start_time: start,
      end_time: end,
    });
    setEditingTimetable(null);
    setShowForm(true);
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
    <AdminLayout
      adminName={adminName}
      adminEmail={adminEmail}
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Timetable Management
            </h1>
            <p className="text-sm text-gray-400">
              Schedule classes with rooms and time slots
            </p>
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

                <div>
                  <Label>Time Slot *</Label>
                  <Select
                    value={formData.start_time}
                    onValueChange={(val) => {
                      const slot = timeSlots.find((s) => s.start === val);
                      if (slot) {
                        setFormData({
                          ...formData,
                          start_time: slot.start,
                          end_time: slot.end,
                        });
                      }
                    }}
                    required
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue placeholder="Select a time slot" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot.start} value={slot.start}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    {editingTimetable ? "Update Timetable" : "Create Timetable"}
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

      {/* Timetables Grid */}
      <Card className="bg-gray-900 border-gray-800 mb-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="p-4 border-b border-gray-800 bg-gray-950 font-semibold text-gray-300 w-32 sticky left-0 z-10">
                  Time
                </th>
                {days.map((day) => {
                  if (filterDay !== "all" && filterDay !== day) return null;
                  return (
                    <th key={day} className="p-4 border-b border-gray-800 bg-gray-950 font-semibold text-gray-300 min-w-[200px] text-center">
                      {day}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.start} className="group">
                  <td className="p-4 border-b border-gray-800 bg-gray-950/50 text-gray-400 text-sm font-medium sticky left-0 z-10">
                    {slot.start} - {slot.end}
                  </td>
                  {days.map((day) => {
                    if (filterDay !== "all" && filterDay !== day) return null;

                    // Find if there is a class on this day at this time slot
                    const classInSlot = filteredTimetables.find((t) => {
                      const tStart = new Date(t.start_time).toTimeString().slice(0, 5);
                      return t.day === day && tStart === slot.start;
                    });

                    return (
                      <td key={`${day}-${slot.start}`} className="p-2 border-b border-l border-gray-800 relative min-h-[100px] align-top">
                        {classInSlot ? (
                          <div className="bg-purple-900/40 border border-purple-800/60 rounded-lg p-3 h-full flex flex-col justify-between group/card hover:bg-purple-900/60 transition-colors">
                            <div>
                              <div className="font-bold text-purple-200 text-sm mb-1 leading-tight">
                                {classInSlot.course_id.course_code}
                              </div>
                              <div className="text-xs text-gray-300 font-medium mb-2 line-clamp-2">
                                {classInSlot.course_id.course_name}
                              </div>
                              <div className="text-xs text-purple-300/80 bg-purple-950/50 inline-block px-1.5 py-0.5 rounded">
                                {classInSlot.room_id.room_number}
                              </div>
                            </div>
                            
                            <div className="flex gap-1 justify-end mt-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6 text-gray-400 hover:text-white hover:bg-gray-800"
                                onClick={() => handleEdit(classInSlot)}
                              >
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(classInSlot)}
                                className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-950/50"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-full min-h-[90px] w-full flex items-center justify-center p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-dashed border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500 bg-transparent w-full h-full"
                              onClick={() => handleAddForSlot(day, slot.start, slot.end)}
                            >
                              <Plus className="w-4 h-4 mr-1" /> Add
                            </Button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Stats */}
      <div className="mt-4 text-sm text-gray-400">
        Total: {filteredTimetables.length} timetable entries
      </div>
    </AdminLayout>
  );
}
