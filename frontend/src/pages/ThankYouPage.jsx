export default function ThankYouPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-md rounded-lg p-8 text-center max-w-md">
        <h1 className="text-2xl font-semibold text-slate-800 mb-3">
           Thank You!
        </h1>

        <p className="text-slate-600 mb-6">
          Thank you for your response. We appreciate your time!
          <br />
          We will reach out to you soon.
        </p>

        <a
          href="https://www.google.com/"
          className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}