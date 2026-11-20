import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Page Not Found | Mentor Lagbe",
};

const CURRENT_YEAR = new Date().getFullYear();

const NotFound = () => {
    return (
        <main className="flex min-h-screen items-center justify-center bg-white px-6">
            <div className="max-w-md text-center">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
                        <span className="text-4xl" role="img" aria-label="Mentorship">
                            🎓
                        </span>
                    </div>
                </div>

                {/* Error code */}
                <h1 className="text-8xl font-bold tracking-tight text-gray-900">404</h1>

                {/* Message */}
                <h2 className="mt-4 text-2xl font-semibold text-gray-800">
                    Oops! Page Not Found
                </h2>
                <p className="mt-3 leading-relaxed text-gray-500">
                    We couldn&apos;t find the page you were looking for. Let&apos;s get you
                    back on track to finding the right mentor.
                </p>

                {/* Actions */}
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        href="/"
                        className="rounded-lg bg-gray-900 px-8 py-3 font-medium text-white transition duration-300 hover:bg-gray-700"
                    >
                        Back to Home
                    </Link>
                    <Link
                        href="/mentors"
                        className="rounded-lg border border-gray-300 px-8 py-3 font-medium text-gray-800 transition duration-300 hover:bg-gray-50"
                    >
                        Find a Mentor
                    </Link>
                </div>

                {/* Footer */}
                <p className="mt-8 text-sm text-gray-400">
                    © {CURRENT_YEAR} Mentor Lagbe. All rights reserved.
                </p>
            </div>
        </main>
    );
};

export default NotFound;