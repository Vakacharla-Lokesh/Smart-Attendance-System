"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    enrollNo: "",
    course: "",
    year: "",
    section: "",
    phone: "",
    cardNumber: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(), // matches Student.email
          password: formData.password,
          enroll_no: formData.enrollNo.trim(), // maps to both models
          phone: formData.phone.trim(), // matches Student.phone
          course: formData.course.trim() || undefined,
          year: formData.year ? parseInt(formData.year) : undefined,
          section: formData.section.trim() || undefined,
          card_number: formData.cardNumber.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      router.push("/home");
    } catch (err) {
      console.error("Registration error:", err);
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-2 rounded-4xl bg-gradient-to-b bg-black">
        <Link href={"/"}>
          <Button variant="default">Back</Button>
        </Link>
      </div>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b bg-black font-sans px-4 py-8">
        <Card className="w-full max-w-2xl shadow-md rounded-2xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Register</h2>

            {error && (
              <Alert
                variant="destructive"
                className="mb-4"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="John Doe"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Enrollment Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Enrollment Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="enrollNo"
                    placeholder="EN12345"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    value={formData.enrollNo}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="9876543210"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Course */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Course
                  </label>
                  <input
                    type="text"
                    name="course"
                    placeholder="B.Tech CSE"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.course}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <select
                    name="year"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.year}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="5">5th Year</option>
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    name="section"
                    placeholder="A"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.section}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Card Number */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    name="cardNumber"
                    placeholder="RFID Card Number"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </Button>
            </form>

            <p className="text-sm text-gray-600 text-center mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:underline"
              >
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
