// Updated: 2024-06-09

async function safeFetchJson(url: string, options: any): Promise<any> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  } catch (err) {
    throw new Error(`Request to ${url} failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function callFlairNER(text: string): Promise<string[]> {
  const data = await safeFetchJson('http://localhost:5001/flair-ner', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  return data.persons || [];
}

export async function callHumanNameResolver(names: string[]): Promise<any[]> {
  const data = await safeFetchJson('http://localhost:5002/parse-name', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ names }),
  });
  return data.parsed_names || [];
}

export async function callPersonResolution(text: string): Promise<{ persons: string[], name_map: any }> {
  return await safeFetchJson('http://localhost:5003/resolve-persons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}

export async function callHolmesExtractor(text: string, persons: string[]): Promise<any> {
  return await safeFetchJson('http://localhost:5004/holmes-extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, persons }),
  });
}

export async function callGLiREL(text: string, persons: string[]): Promise<any> {
  return await safeFetchJson('http://localhost:5005/glirel-relationships', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, persons }),
  });
} 