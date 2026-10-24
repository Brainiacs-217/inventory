"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function SquareOAuthNotice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("square_connected") === "1") {
      setMessage("Square connected.");
      setError(null);
      router.replace("/dashboard");
      return;
    }

    const squareError = searchParams.get("square_error");
    if (squareError) {
      setError(formatSquareError(squareError));
      setMessage(null);
      router.replace("/dashboard");
    }
  }, [router, searchParams]);

  if (!message && !error) return null;

  return (
    <p className={`shrink-0 text-sm ${error ? "text-error" : "text-success"}`}>
      {error ?? message}
    </p>
  );
}

function formatSquareError(code: string): string {
  switch (code) {
    case "invalid_request":
      return "Square connection failed: invalid request.";
    case "invalid_state":
      return "Square connection failed: session expired. Try again.";
    case "no_organization":
      return "Create the organization again before connecting Square.";
    case "oauth_not_configured":
      return "Square OAuth is not configured.";
    case "token_exchange":
      return "Square connection failed: could not exchange authorization code.";
    default:
      return `Square connection failed: ${code}`;
  }
}
