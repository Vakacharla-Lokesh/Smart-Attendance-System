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
  BookOpen,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Search,
  X,
} from "lucide-react";

interface Course {
  _id: string;
  course_code: string;
  course_name: string;
  department: string;
  credits: number;
  instructor_name?: string;
  instructor_email?: string;
  year: number;
  semester: number;
  is_active: boolean;
}

export default function CourseManagement() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    department: "",
    credits: "3",
    instructor_name: "",
    instructor_email: "",
    year: "1",
    semester: "1",
    is_active: true,
  });

  useEffect(() => {
    checkAuth();
    fetchCourses();
  }, []);

  useEffect(() => {
    filterCourses();
  }, [searchTerm, courses]);

  const checkAuth = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
  };

  const fetchCourses = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          router.push("/home");
          return;
        }
        throw new Error("Failed to fetch courses");
      }

      const data = await response.json();
      setCourses(data.courses || []);
      setFilteredCourses(data.courses || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    if (!searchTerm) {
      setFilteredCourses(courses);
      return;
    }

    const filtered = courses.filter(
      (course) =>
        course.course_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.course_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.instructor_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()),
    );
    setFilteredCourses(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const url = editingCourse
        ? `/api/admin/courses/${editingCourse._id}`
        : "/api/admin/courses";
      const method = editingCourse ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          credits: parseInt(formData.credits),
          year: parseInt(formData.year),
          semester: parseInt(formData.semester),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Operation failed");
      }

      setSuccess(
        editingCourse
          ? "Course updated successfully"
          : "Course created successfully",
      );
      resetForm();
      fetchCourses();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      course_code: course.course_code,
      course_name: course.course_name,
      department: course.department,
      credits: course.credits.toString(),
      instructor_name: course.instructor_name || "",
      instructor_email: course.instructor_email || "",
      year: course.year.toString(),
      semester: course.semester.toString(),
      is_active: course.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (course: Course) => {
    if (
      !confirm(
        `Are you sure you want to delete ${course.course_code} - ${course.course_name}?`,
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/courses/${course._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete course");
      }

      setSuccess("Course deleted successfully");
      fetchCourses();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      course_code: "",
      course_name: "",
      department: "",
      credits: "3",
      instructor_name: "",
      instructor_email: "",
      year: "1",
      semester: "1",
      is_active: true,
    });
    setEditingCourse(null);
    setShowForm(false);
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
            <Link href="/admin">
              <Button
                variant="ghost"
                size="icon"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Course Management</h1>
                <p className="text-sm text-gray-400">
                  Create and manage courses
                </p>
              </div>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Course
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
            <Card className="w-full max-w-2xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  {editingCourse ? "Edit Course" : "Add New Course"}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Course Code *</Label>
                      <Input
                        value={formData.course_code}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            course_code: e.target.value.toUpperCase(),
                          })
                        }
                        placeholder="CSE301"
                        required
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <Label>Department *</Label>
                      <Input
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            department: e.target.value,
                          })
                        }
                        placeholder="Computer Science"
                        required
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Course Name *</Label>
                    <Input
                      value={formData.course_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          course_name: e.target.value,
                        })
                      }
                      placeholder="Data Structures and Algorithms"
                      required
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Credits *</Label>
                      <Select
                        value={formData.credits}
                        onValueChange={(value) =>
                          setFormData({ ...formData, credits: value })
                        }
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <SelectItem
                              key={n}
                              value={n.toString()}
                            >
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Year *</Label>
                      <Select
                        value={formData.year}
                        onValueChange={(value) =>
                          setFormData({ ...formData, year: value })
                        }
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4].map((n) => (
                            <SelectItem
                              key={n}
                              value={n.toString()}
                            >
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Semester *</Label>
                      <Select
                        value={formData.semester}
                        onValueChange={(value) =>
                          setFormData({ ...formData, semester: value })
                        }
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <SelectItem
                              key={n}
                              value={n.toString()}
                            >
                              {n}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Instructor Name</Label>
                      <Input
                        value={formData.instructor_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            instructor_name: e.target.value,
                          })
                        }
                        placeholder="Dr. John Smith"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <Label>Instructor Email</Label>
                      <Input
                        type="email"
                        value={formData.instructor_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            instructor_email: e.target.value,
                          })
                        }
                        placeholder="john.smith@university.edu"
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
                      className="bg-green-600"
                    >
                      {editingCourse ? "Update Course" : "Create Course"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search by code, name, department, or instructor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-800"
            />
          </div>
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-400">
              No courses found. Click &quot;Add Course&quot; to create one.
            </div>
          ) : (
            filteredCourses.map((course) => (
              <Card
                key={course._id}
                className="bg-gray-900 border-gray-800 hover:bg-gray-800/50 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <code className="text-sm bg-gray-800 px-2 py-1 rounded text-green-400">
                        {course.course_code}
                      </code>
                      <CardTitle className="mt-2 text-lg">
                        {course.course_name}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-400">
                    <p>
                      <span className="font-medium">Department:</span>{" "}
                      {course.department}
                    </p>
                    <p>
                      <span className="font-medium">Credits:</span>{" "}
                      {course.credits}
                    </p>
                    <p>
                      <span className="font-medium">Year/Sem:</span> Year{" "}
                      {course.year}, Sem {course.semester}
                    </p>
                    {course.instructor_name && (
                      <p>
                        <span className="font-medium">Instructor:</span>{" "}
                        {course.instructor_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(course)}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(course)}
                      className="flex-1 text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 text-sm text-gray-400">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      </div>
    </div>
  );
}
