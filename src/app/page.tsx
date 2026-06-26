export default function Home() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-black">
      <main className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Inventory
        </h1>
        <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
          BurgerBots inventory management — Next.js, Tailwind, and Supabase.
        </p>
        <a
          href="/api/health"
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Check API health
        </a>
      </main>
    </div>
  );
}
