import { WifiOff } from "lucide-react";

function ErrorMessage({ title = "We couldn't load this data" }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <p className="font-medium text-amber-800">{title}</p>
        <p className="mt-1 text-sm text-amber-700">
          This usually happens when your session has expired or is out of sync.
          Try logging out and back in — if it still doesn't load, please try
          again in a moment.
        </p>
      </div>
    </div>
  );
}

export default ErrorMessage;
