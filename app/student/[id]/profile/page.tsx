"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function StudentProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function fetchStudent() {
      try {
        const res = await fetch(`/api/students/${id}`);
        if (res.ok) {
          const json = await res.json();
          const student = json.data || json;
          setName(student.name || "");
          setEmail(student.email || "");
        }
      } catch (error) {
        console.error("Failed to load student", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStudent();
  }, [id]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch(`/api/students/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        setMessage({ text: "Profile updated successfully!", type: "success" });
      } else {
        const data = await res.json();
        setMessage({ text: data.error || "Failed to update profile", type: "error" });
      }
    } catch {
      setMessage({ text: "An error occurred while saving", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (newPassword !== confirmPassword) {
      setMessage({ text: "New passwords do not match", type: "error" });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/students/${id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setMessage({ text: "Password updated successfully!", type: "success" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        const data = await res.json();
        setMessage({ text: data.error || "Failed to update password", type: "error" });
      }
    } catch {
      setMessage({ text: "An error occurred while changing password", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020617] text-white">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 bg-[#020617] text-white">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href={`/student/${id}`}>
            <Button className="!border !border-white/10 text-white hover:bg-white/10" variant="ghost">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Manage Profile</h1>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-md border ${
              message.type === "error"
                ? "bg-red-500/10 border-red-500/50 text-red-400"
                : "bg-green-500/10 border-green-500/50 text-green-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <Card className="bg-[#0f172a] border border-white/10 text-white">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription className="text-white/50">
                Update your personal details and public photo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">

                  {/* ✅ AVATAR (REPLACED PHOTO UI) */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center border border-white/10">
                      <div className="text-xl font-semibold text-emerald-400">
                        {name?.split(" ").map((n) => n[0]).join("") || "N"}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-white/80">Full Name</Label>
                      <Input 
                        id="name" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required 
                        className="bg-[#020617] border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/80">Email</Label>
                      <Input 
                        id="email" 
                        value={email} 
                        disabled 
                        className="bg-[#020617] border-white/10 text-white/50"
                      />
                      <p className="text-xs text-white/40">Email cannot be changed.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-[#0f172a] border border-white/10 text-white">
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription className="text-white/50">
                Change your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-white/80">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-[#020617] border-white/10 text-white"
                  />
                  <p className="text-xs text-white/40">
                    Leave blank if you don&apos;t remember, but it&apos;s recommended to provide it.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-white/80">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="bg-[#020617] border-white/10 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-white/80">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="bg-[#020617] border-white/10 text-white"
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" variant="secondary" disabled={saving}>
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}