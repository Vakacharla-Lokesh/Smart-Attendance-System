import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function page() {
  return (
    <>
      <div className="p-2 rounded-4xl bg-gradient-to-b from-gray-50 to-gray-100">
        <Link href={"/"}>
          <Button variant="default">Back</Button>
        </Link>
      </div>
      <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-gray-50 to-gray-100 font-sans px-4 py-16">
        <Card className="w-full max-w-3xl shadow-md rounded-2xl">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-center mb-10">
              Frequently Asked Questions
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">
                  1. What is the Smart Attendance System?
                </h3>
                <p className="text-gray-600 mt-2">
                  The Smart Attendance System is an IoT-based platform that
                  automates attendance tracking using RFID technology and
                  real-time monitoring.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  2. How do I request an account?
                </h3>
                <p className="text-gray-600 mt-2">
                  You cannot directly sign up. Instead, you need to fill out the{" "}
                  <strong>Contact Admin</strong> form and the administrator will
                  create an account for you.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  3. Can I access the system from my mobile device?
                </h3>
                <p className="text-gray-600 mt-2">
                  Yes, the system is fully responsive and can be accessed via
                  both desktop and mobile browsers.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">4. Is my data secure?</h3>
                <p className="text-gray-600 mt-2">
                  Absolutely. The platform ensures secure authentication and
                  encrypted communication for all users.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  5. Who do I contact for technical issues?
                </h3>
                <p className="text-gray-600 mt-2">
                  For any technical issues, please reach out to the system
                  administrator through the
                  <strong> Contact Admin</strong> page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export const metadata = {
  title: "FAQs | Smart RFID Attendance System",
  description:
    "Frequently asked questions about the Smart RFID Attendance System.",
};
