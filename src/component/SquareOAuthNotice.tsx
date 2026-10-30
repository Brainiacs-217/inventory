"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { formatSquareOAuthError } from "@/lib/square/constants";

export function SquareOAuthNotice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("resume_create_org") === "1") return;

    if (searchParams.get("square_connected") === "1") {
      setMessage("Square connected.");
      setError(null);
      router.replace("/dashboard");
      return;
    }

    const squareError = searchParams.get("square_error");
    if (squareError) {
      setError(
        formatSquareOAuthError(squareError, searchParams.get("square_error_detail")),
      );
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
