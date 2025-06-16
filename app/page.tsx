"use client";
import Link from 'next/link'
import { SparklesPreview } from "@/components/ui/sparkles-preview"

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-4 sm:px-6 md:px-8 lg:px-20 text-center">
        <SparklesPreview />
      </main>
    </div>
  )
}