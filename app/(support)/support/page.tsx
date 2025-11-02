import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function page() {
  return (
    <>
      <div className="p-2 rounded-4xl bg-gradient-to-b bg-black">
        <Link href={"/"}>
          <Button variant="default">Back</Button>
        </Link>
      </div>
      <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b bg-black font-sans px-4 py-16">
        <Card className="w-full max-w-2xl shadow-md rounded-2xl">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center mb-10">
              Contact Admin
            </h2>

            <form className="space-y-6">
              {/* Employee ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter your Employee ID"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter your name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Enter your email"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Describe why you need an account (optional)"
                  rows={4}
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 text-white py-2 px-4 font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Submit Request
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export const metadata = {
  title: "Contact Admin | Smart RFID Attendance System",
  description:
    "Request account creation by contacting the system administrator.",
};
