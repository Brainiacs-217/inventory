import { AuthForm } from "@/component/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="min-h-0 w-full flex-1 overflow-y-auto overscroll-y-contain bg-background">
      <div className="flex min-h-full w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-sm">
          <AuthForm
            initialError={
              error === "auth"
                ? "Sign-in didn't finish. Please try again."
                : null
            }
          />
        </div>
      </div>
    </main>
  );
}
