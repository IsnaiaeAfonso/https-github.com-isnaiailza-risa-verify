import { get, list, put } from "@vercel/blob";

export async function readPrivateBlobJson<T>(pathname: string): Promise<T | undefined> {
  const result = await get(pathname, { access: "private", useCache: false });
  if (!result || result.statusCode !== 200) return undefined;
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as T;
}

export async function writePrivateBlobJson(pathname: string, value: unknown): Promise<void> {
  await put(pathname, JSON.stringify(value), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

export async function listPrivateBlobJson<T>(prefix: string): Promise<T[]> {
  const values: T[] = [];
  let cursor: string | undefined;

  do {
    const page = await list({ prefix, limit: 1000, cursor });
    for (const blob of page.blobs) {
      const value = await readPrivateBlobJson<T>(blob.pathname);
      if (value !== undefined) values.push(value);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  return values;
}