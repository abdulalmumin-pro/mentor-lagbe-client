import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Page Not Found | Mentor Lagbe",
};

const CURRENT_YEAR = new Date().getFullYear();

const NotFound = () => {
    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6">
            <div className="max-w-md text-center">
                {/* Icon */}
                <div className="mb-6 flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-900 ring-1 ring-gray-800">
                        <span className="text-4xl" role="img" aria-label="Mentorship">
                            🎓
                        </span>
                    </div>
                </div>

                {/* Error code */}
                <h1 className="text-8xl font-bold tracking-tight text-white">404</h1>

                {/* Message */}
                <h2 className="mt-4 text-2xl font-semibold text-gray-200">
                    Oops! Page Not Found
                </h2>
                <p className="mt-3 leading-relaxed text-gray-400">
                    We couldn&apos;t find the page you were looking for. Let&apos;s get you
                    back on track to finding the right mentor.
                </p>

                {/* Actions */}
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                    <Link
                        href="/"
                        className="rounded-lg bg-white px-8 py-3 font-medium text-gray-900 transition duration-300 hover:bg-gray-200"
                    >
                        Back to Home
                    </Link>
                    <Link
                        href="/mentors"
                        className="rounded-lg border border-gray-700 px-8 py-3 font-medium text-gray-200 transition duration-300 hover:bg-gray-900"
                    >
                        Find a Mentor
                    </Link>
                </div>

                {/* Footer */}
                <p className="mt-8 text-sm text-gray-500">
                    © {CURRENT_YEAR} Mentor Lagbe. All rights reserved.
                </p>
            </div>
        </main>
    );
};

export default NotFound;