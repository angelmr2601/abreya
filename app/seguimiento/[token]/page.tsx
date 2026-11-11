import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, KeyRound } from "lucide-react";
import TrackingClient from "./tracking-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Seguimiento de solicitud | AbreYa",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

type PageProps = {
  params: Promise<{
    token: string;
  }>;
};

export default async function TrackingPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-[#f6f7f4] text-[#151a17]">
      <header className="bg-[#101512] text-white">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-black">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#dfff54] text-[#111713]">
              <KeyRound size={19} />
            </div>
            AbreYa
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-white/70"
          >
            <ArrowLeft size={15} />
            Inicio
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-6 sm:px-6 md:py-10">
        <TrackingClient token={token} />
      </section>
    </main>
  );
}
