import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-8 mt-12">
      <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center gap-3">
        {/* Brand */}
        <div className="mb-6 md:mb-0 gap-2 flex flex-col justify-center items-center">
          <h3 className="text-xl font-bold text-white">
            Smart Attendance System
          </h3>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} All rights reserved.
          </p>
        </div>

        {/* Links */}
        <div>
          <nav className="flex space-x-6">
            <Link
              href="/faqs"
              className="hover:text-white transition-colors"
            >
              FAQs
            </Link>
            <Link
              href="/support"
              className="hover:text-white transition-colors"
            >
              Support
            </Link>
            <Link
              href="/team"
              className="hover:text-white transition-colors"
            >
              Meet the Team
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
