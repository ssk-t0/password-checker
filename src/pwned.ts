// Have I Been Pwned の Pwned Passwords API で漏洩件数を調べる
// パスワードそのものは送らず、SHA-1ハッシュの先頭5文字だけを送る（k-匿名性）

export type PwnedResult = {
  hash: string;
  prefix: string;
  suffix: string;
  count: number;
};

// 文字列をSHA-1ハッシュ（16進数・大文字）に変換
async function sha1(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-1", data);

  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export async function checkPwned(password: string): Promise<PwnedResult> {
  const hash = await sha1(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  // Add-Padding: レスポンスにダミー行を混ぜて、通信量から推測されにくくする
  const response = await fetch(
    `https://api.pwnedpasswords.com/range/${prefix}`,
    { headers: { "Add-Padding": "true" } }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  // 「残り35文字:件数」の一覧から、自分のハッシュを手元で探す
  const text = await response.text();
  let count = 0;

  for (const line of text.split("\n")) {
    const [candidate, times] = line.trim().split(":");
    if (candidate === suffix) {
      count = Number(times);
      break;
    }
  }

  return { hash, prefix, suffix, count };
}
