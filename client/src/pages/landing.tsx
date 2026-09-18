import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#070b12] p-2 lg:p-6">
      <div className="min-h-[calc(100vh-2rem)] overflow-hidden rounded-3xl border border-white/10 bg-background shadow-2xl">

        {/* HEADER */}
        <header className="border-b border-white/10 bg-background/80 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <span className="text-xl font-semibold">
              HR System
            </span>

            <a href="/api/login">
              <Button>Sign In</Button>
            </a>
          </div>
        </header>

        {/* HERO */}
        <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden">

          <div className="absolute inset-0 bg-gradient-to-br from-[#070b12] via-background to-[#111827]" />

          <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative container mx-auto px-6 py-20 lg:px-24 lg:py-28">
            <div className="max-w-2xl">

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Human Resource Management System
              </h1>

              <p className="mt-6 text-lg text-muted-foreground">
                Manage employee leave, HR records and payroll
                through a structured internal workspace.
              </p>

              <div className="mt-10">
                <a href="/api/login">
                  <Button size="lg">
                    Get Started
                  </Button>
                </a>
              </div>

              <div className="mt-12 rounded-2xl border border-white/10 bg-background/60 p-6 backdrop-blur">
                <p className="text-lg font-semibold leading-snug sm:text-xl">
                  Simple processes. Clear decisions. Smoother operations.
                </p>
              </div>

              <div className="mt-12">
                <h2 className="mb-4 text-xl font-bold">
                  Three Roles, Clear Workflow
                </h2>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-white/5 p-5 text-center backdrop-blur">
                    <h3 className="font-semibold">
                      Employee
                    </h3>
                  </div>

                  <div className="rounded-xl bg-white/5 p-5 text-center backdrop-blur">
                    <h3 className="font-semibold">
                      HR
                    </h3>
                  </div>

                  <div className="rounded-xl bg-white/5 p-5 text-center backdrop-blur">
                    <h3 className="font-semibold">
                      Director
                    </h3>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>

        {/* FOOTER */}
        <footer className="border-t border-white/10 bg-background/90 py-6 backdrop-blur">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            Internal HR System
          </div>
        </footer>

      </div>
    </div>
  );
}
