import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, MapPin, Shield } from "lucide-react";
import Footer from "@/components/footer";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-gray-100 font-sans">
      {/* Navbar */}
      <nav className="w-full flex items-center justify-between px-6 py-4 shadow-sm bg-white">
        <h1 className="text-xl font-bold">Smart Attendance</h1>
        <Link href="/login">
          <Button variant="default">Login</Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-20 px-6">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          Smart RFID Attendance System
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          IoT-powered solution with real-time monitoring, geolocation tracking,
          and anti-proxy authentication for secure attendance.
        </p>
        <Button className="mt-8 text-lg px-6 py-3">Get Started</Button>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Card className="rounded-2xl shadow-md">
          <CardContent className="flex flex-col items-center text-center p-6">
            <CheckCircle className="w-10 h-10 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">RFID Integration</h3>
            <p className="text-gray-600">
              Seamless RFID-based attendance logging with real-time updates.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="flex flex-col items-center text-center p-6">
            <MapPin className="w-10 h-10 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Geolocation Tracking</h3>
            <p className="text-gray-600">
              Ensure accurate attendance by validating location at check-in.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md">
          <CardContent className="flex flex-col items-center text-center p-6">
            <Shield className="w-10 h-10 text-red-600 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Anti-Proxy Security</h3>
            <p className="text-gray-600">
              Prevent fraudulent attendance with advanced anti-proxy checks.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-white shadow-inner">
        <h2 className="text-3xl font-bold text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {[
            "Tap RFID card at scanner",
            "Verify location & identity",
            "Attendance logged in real-time",
          ].map((step, i) => (
            <Card
              key={i}
              className="rounded-2xl shadow-md"
            >
              <CardContent className="p-6 text-center font-medium text-gray-700">
                <span className="text-2xl font-bold text-blue-600">
                  {i + 1}
                </span>
                <p className="mt-4">{step}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export const metadata = {
  title: "Smart RFID Attendance System",
  description:
    "IoT-based smart attendance tracking system with RFID, geolocation, and anti-proxy authentication.",
};
