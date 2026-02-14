"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token in localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to home
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <>
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4 shadow-sm bg-black border-b border-gray-800">
        <Link
          href="/"
          className="flex items-center gap-2"
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <h1 className="text-xl font-bold text-white">Smart Attendance</h1>
        </Link>
        <div className="flex gap-4">
          <Link href="/faqs">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white"
            >
              FAQs
            </Button>
          </Link>
          <Link href="/support">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white"
            >
              Support
            </Button>
          </Link>
        </div>
      </nav>

      {/* Login Form */}
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-gradient-to-b bg-black font-sans px-4">
        <Card className="w-full max-w-md shadow-lg rounded-2xl border-gray-800">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-3xl font-bold text-center">
              Welcome Back
            </CardTitle>
            <p className="text-center text-gray-400 text-sm">
              Sign in to access your attendance dashboard
            </p>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {error && (
              <Alert
                variant="destructive"
                className="mb-4"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Email Field */}
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium"
                >
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@amity.edu"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium"
                  >
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-blue-500 hover:text-blue-400"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 bg-gray-900 border-gray-800 text-white placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-gray-400">
                  Need an account?
                </span>
              </div>
            </div>

            {/* Contact Admin */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-400">
                Don&apos;t have access yet?
              </p>
              <Link href="/support">
                <Button
                  variant="outline"
                  className="w-full border-gray-800 text-gray-300 hover:bg-gray-900 hover:text-white"
                >
                  Contact Administrator
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-sm text-gray-500">
            Secured with RFID authentication and geolocation verification
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-gray-600">
            <Link
              href="/faqs"
              className="hover:text-blue-500"
            >
              Help & FAQs
            </Link>
            <span>•</span>
            <Link
              href="/privacy"
              className="hover:text-blue-500"
            >
              Privacy Policy
            </Link>
            <span>•</span>
            <Link
              href="/terms"
              className="hover:text-blue-500"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export const metadata = {
  title: "Login | Smart RFID Attendance System",
  description:
    "Login to access the IoT-based smart attendance tracking system.",
};
