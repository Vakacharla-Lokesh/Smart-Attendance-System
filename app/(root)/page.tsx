"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MapPin, Shield } from "lucide-react";
import Footer from "@/components/footer";
import { Analytics } from "@vercel/analytics/next";

export default function Page() {
  return (
    <>
      <Analytics />

      <div className="h-screen overflow-hidden flex flex-col bg-gradient-to-br from-[#0f172a] via-[#0b1a33] to-[#020617] text-white">

        {/* Navbar */}
        <nav className="flex items-center justify-between px-8 py-4 bg-[#0b1120]/80 backdrop-blur border-b border-slate-800">
          <h1 className="text-xl font-bold text-white">
            Smart Attendance
          </h1>

          <Link href="/login">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 rounded-lg shadow">
              Login
            </Button>
          </Link>
        </nav>

        {/* MAIN GRID */}
        <div className="flex-1 grid grid-cols-2 gap-8 px-12 py-8 max-w-7xl mx-auto w-full">

          {/* LEFT PANEL */}
          <div className="flex flex-col justify-center">

            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              Smart RFID
              <br />
              Attendance System
            </h1>

            <p className="text-slate-300 text-lg max-w-lg mb-8">
              IoT-powered attendance platform with RFID scanning,
              geolocation verification, and anti-proxy security
              for modern classrooms.
            </p>

            <Link href="/login">
              <Button className="w-fit px-8 py-6 text-lg bg-emerald-500 hover:bg-emerald-600 shadow-lg rounded-lg">
                Get Started
              </Button>
            </Link>

          </div>

          {/* RIGHT PANEL */}
          <div className="grid grid-cols-2 gap-6">

            {/* Feature Cards */}

            <Card className="rounded-2xl bg-[#0f172a]/70 border border-slate-800 hover:border-slate-700 hover:shadow-xl transition">
              <CardContent className="p-6 text-center">
                <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2 text-white">RFID Integration</h3>
                <p className="text-sm text-slate-400">
                  Automatic RFID-based attendance logging
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-[#0f172a]/70 border border-slate-800 hover:border-slate-700 hover:shadow-xl transition">
              <CardContent className="p-6 text-center">
                <MapPin className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2 text-white">Location Validation</h3>
                <p className="text-sm text-slate-400">
                  Verify attendance using geolocation
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl bg-[#0f172a]/70 border border-slate-800 hover:border-slate-700 hover:shadow-xl transition">
              <CardContent className="p-6 text-center">
                <Shield className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="font-semibold mb-2 text-white">Anti-Proxy Security</h3>
                <p className="text-sm text-slate-400">
                  Prevent proxy attendance attempts
                </p>
              </CardContent>
            </Card>

            {/* Steps Card */}
            <Card className="rounded-2xl bg-[#0f172a]/70 border border-slate-800">
              <CardContent className="p-6">

                <h3 className="font-semibold mb-4 text-center text-white">
                  How It Works
                </h3>

                <div className="space-y-3 text-sm text-slate-400">

                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-400">1</span>
                    Tap RFID card at scanner
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-400">2</span>
                    Verify location & identity
                  </div>

                  <div className="flex gap-3">
                    <span className="font-bold text-emerald-400">3</span>
                    Attendance logged instantly
                  </div>

                </div>

              </CardContent>
            </Card>

          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-slate-500 py-4 border-t border-slate-800">
          © 2026 Smart Attendance System
        </footer>

      </div>
    </>
  );
}