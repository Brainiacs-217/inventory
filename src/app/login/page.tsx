import { AuthForm } from "@/component/AuthForm";

export default function LoginPage() {
  return (
    <main className="h-full overflow-y-auto overscroll-y-contain bg-background">
      <div className="flex min-h-full w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-sm">
          <AuthForm />
        </div>
      </div>
    </main>
  );
}
