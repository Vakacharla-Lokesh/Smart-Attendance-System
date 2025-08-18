import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function page() {
  return (
    <>
      <div className="p-2 rounded-4xl bg-gradient-to-b from-gray-50 to-gray-100">
        <Link href={"/"}>
          <Button variant="default">Back</Button>
        </Link>
      </div>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 font-sans px-4">
        <Card className="w-full max-w-md shadow-md rounded-2xl">
          <CardContent className="p-8">
            <h2 className="text-2xl font-bold text-center mb-6">Login</h2>
            <form className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
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
                />
              </div>
              <Button
                type="submit"
                className="w-full mt-4"
              >
                Sign In
              </Button>
            </form>
            <p className="text-sm text-gray-600 text-center mt-6">
              Don’t have an account?{" "}
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

export const metadata = {
  title: "Login | Smart RFID Attendance System",
  description:
    "Login to access the IoT-based smart attendance tracking system.",
};
