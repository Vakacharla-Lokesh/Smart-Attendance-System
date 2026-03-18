"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_id: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      if (data.user.is_admin) {
        router.push("/admin");
      } else {
        router.push("/home");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#0b1a33] to-[#020617] text-white font-sans px-4">

        {/* Back Button */}
        <div className="absolute top-6 left-6">
          <Link href={"/"}>
            <Button
              variant="outline"
              className="border-slate-700 bg-[#0f172a]/60 text-white hover:bg-slate-800"
            >
              ← Back
            </Button>
          </Link>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-md shadow-2xl rounded-2xl border border-slate-800 bg-[#0f172a]/80 backdrop-blur">
          <CardContent className="p-8">

            <h2 className="text-2xl font-bold text-center mb-6 text-white">
              Login
            </h2>

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">
                  Email
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 bg-[#020617] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-300">
                  Password
                </label>

                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full px-4 py-2 bg-[#020617] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg"
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

            <p className="text-sm text-slate-400 text-center mt-6">
              Don&apos;t have an account?{" "}
              <Link href="/support" className="text-emerald-400 hover:underline">
                Contact Admin
              </Link>
            </p>

          </CardContent>
        </Card>

      </div>
    </>
  );
}