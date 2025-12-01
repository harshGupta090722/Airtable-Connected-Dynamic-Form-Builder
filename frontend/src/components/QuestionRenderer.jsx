export default function QuestionRenderer({ question }) {
  const { label, type, required } = question;

  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">
        {label}{" "}
        {required && <span className="text-red-500 text-xs">*</span>}
      </label>

      {type === "singleLineText" || type === "text" ? (
        <input
          disabled
          className="w-full border rounded-md px-2 py-1 text-sm bg-gray-50"
          placeholder="Short text answer"
        />
      ) : type === "number" ? (
        <input
          type="number"
          disabled
          className="w-full border rounded-md px-2 py-1 text-sm bg-gray-50"
          placeholder="Number"
        />
      ) : type === "longText" ? (
        <textarea
          disabled
          className="w-full border rounded-md px-2 py-1 text-sm bg-gray-50"
          rows={3}
          placeholder="Long answer text"
        />
      ) : (
        <input
          disabled
          className="w-full border rounded-md px-2 py-1 text-sm bg-gray-50"
          placeholder={`Field type: ${type}`}
        />
      )}
    </div>
  );
}