"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  // useRouter allows us to redirect users to different pages
  const router = useRouter();

  // These store what the user types in the form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // This stores any error messages
  const [error, setError] = useState("");

  // This tracks if we're currently logging in (shows loading spinner)
  const [loading, setLoading] = useState(false);

  // This function runs when the user clicks "Log In"
  const handleSubmit = async (e: React.FormEvent) => {
    // Prevent the page from refreshing
    e.preventDefault();

    // Clear any previous errors
    setError("");

    // Show loading spinner
    setLoading(true);

    try {
      // Send login request to our API
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_id: email.trim(),
          password,
        }),
      });

      // Get the response data
      const data = await response.json();

      // Check if login failed
      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      // SUCCESS! Store the token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to home page
      router.push("/home");
    } catch (err) {
      console.error("Login error:", err);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b bg-black font-sans px-4">
        <Card className="w-full max-w-md shadow-md rounded-2xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

            {/* Show error message if login fails */}
            {error && (
              <Alert
                variant="destructive"
                className="mb-4"
              >
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* The login form - now connected to handleSubmit */}
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>
            <p className="text-sm text-gray-600 text-center mt-6">
              Don&apos;t have an account?{" "}
              <Link
                href="/support"
                className="text-blue-600 hover:underline"
              >
                Contact Admin
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
