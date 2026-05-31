"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

export default function ImportButton() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string>("");

  async function runImport(useFile: boolean) {
    setStatus("Importing...");
    try {
      let res: Response;
      if (useFile && fileRef.current?.files?.[0]) {
        const form = new FormData();
        form.append("file", fileRef.current.files[0]);
        res = await fetch("/api/import", { method: "POST", body: form });
      } else {
        res = await fetch("/api/import", { method: "POST" });
      }

      const data = await res.json();
      if (!res.ok) {
        setStatus(`Error: ${data.error ?? "Import failed"}`);
        return;
      }

      const skipped =
        data.skipped?.length > 0
          ? ` (${data.skipped.length} skipped as duplicates)`
          : "";
      setStatus(`Imported ${data.created?.length ?? 0} bill(s).${skipped}`);
      router.refresh();
    } catch {
      setStatus("Error: Import failed");
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <div>
        <button
          onClick={() => runImport(false)}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Import fixture CSV
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={fileRef} type="file" accept=".csv,text/csv" />
        <button
          onClick={() => runImport(true)}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Upload CSV
        </button>
      </div>
      {status && <p className="text-sm text-gray-700">{status}</p>}
    </div>
  );
}
