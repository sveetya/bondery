import { API_ERROR_CODE_ENTRIES, API_ERROR_CODES, API_ERROR_TYPES } from "@bondery/schemas/errors";
import Link from "next/link";
import { WEBSITE_URL } from "@/lib/config";

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-fd-muted px-1.5 py-0.5 font-mono text-[0.875em]">
      {children}
    </code>
  );
}

export function ApiErrorsIndex() {
  const grouped = API_ERROR_TYPES.map((type) => ({
    codes: API_ERROR_CODES.filter((code) => API_ERROR_CODE_ENTRIES[code].type === type),
    type,
  }));

  return (
    <div className="flex flex-col gap-8 not-prose">
      {grouped.map(({ type, codes }) => (
        <section className="flex flex-col gap-2" key={type}>
          <h2 className="text-lg font-semibold">{type}</h2>
          <ul className="flex flex-col gap-1">
            {codes.map((code) => (
              <li key={code}>
                <Link
                  className="text-fd-primary hover:underline"
                  href={`/docs/api/errors/${code}`}
                >
                  <InlineCode>{code}</InlineCode>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-fd-muted-foreground text-sm">
        Base URL for <InlineCode>doc_url</InlineCode> fields: {WEBSITE_URL}
      </p>
    </div>
  );
}
