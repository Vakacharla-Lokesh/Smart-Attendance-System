import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Admin | Smart RFID Attendance System",
  description:
    "Request account creation by contacting the system administrator.",
};

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
