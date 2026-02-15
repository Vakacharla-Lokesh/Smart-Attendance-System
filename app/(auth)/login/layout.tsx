import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Smart RFID Attendance System",
  description:
    "Login to access the IoT-based smart attendance tracking system.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
