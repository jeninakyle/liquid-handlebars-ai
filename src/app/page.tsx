"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [sourceTemplate, setSourceTemplate] = useState("");
  const [convertedTemplate, setConvertedTemplate] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [changes, setChanges] = useState<string[]>([]);

  async function handleConvert() {
    if (!sourceTemplate.trim()) {
      return;
    }

    setIsLoading(true);
    setConvertedTemplate("");
    setErrors([]);
    setWarnings([]);
    setChanges([]);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template: sourceTemplate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors([data.error || "Something went wrong."]);
        return;
      }

      setConvertedTemplate(data.template);
      setErrors(data.errors ?? []);
      setWarnings(data.warnings ?? []);
      setChanges(data.changes ?? []);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Liquid → Handlebars
          </h1>
          <p className="mt-2 text-zinc-600">
            AI-assisted template conversion and validation.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-zinc-800">
              Liquid Input
            </label>
            <textarea
              value={sourceTemplate}
              onChange={(event) => setSourceTemplate(event.target.value)}
              placeholder="Paste your Liquid template here..."
              disabled={isLoading}
              className="h-[420px] w-full resize-none rounded-xl border border-zinc-300 bg-white p-4 font-mono text-sm shadow-sm outline-none focus:border-zinc-500"
            />
          </div>
          <div className="flex flex-col">
            <label className="mb-2 text-sm font-semibold text-zinc-800">
              Handlebars Output
            </label>
            <textarea
              value={convertedTemplate}
              readOnly
              placeholder="Your converted Handlebars will appear here..."
              disabled={isLoading}
              className="h-[420px] w-full resize-none rounded-xl border border-zinc-300 bg-white p-4 font-mono text-sm shadow-sm outline-none" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            {changes.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Changes</h3>
                <ul className="list-disc pl-5">
                  {changes.map((change, index) => (
                    <li key={index}>{change}</li>
                  ))}
                </ul>
              </div>
            )}

            {errors.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Errors</h3>
                <ul className="list-disc pl-5">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {warnings.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold">Warnings</h3>
                <ul className="list-disc pl-5">
                  {warnings.map((warning, index) => (
                    <li key={index}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div> 
        </div>       
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleConvert}
            className="rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
            disabled={isLoading || !sourceTemplate.trim()}>
            {isLoading ? "Converting..." : "Convert"}
          </button>
        </div>
      </div>
    </main>
  );
}