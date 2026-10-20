// 暗号学的に安全な乱数でパスワードを作る
// Math.random() は予測可能なため、パスワード生成には使わない

import * as english from "@zxcvbn-ts/language-en";

export const charSets = {
  lower: "abcdefghijklmnopqrstuvwxyz",
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  digits: "0123456789",
  symbols: "!@#$%^&*-_=+?",
};

export type CharSetName = keyof typeof charSets;

// 0以上max未満の整数を偏りなく返す
// 単純に「乱数 % max」とすると一部の値が出やすくなるため、範囲外は引き直す
function randomInt(max: number): number {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);

  do {
    crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);

  return buffer[0] % max;
}

export function generatePassword(
  length: number,
  sets: CharSetName[]
): string {
  const chars = sets.map((name) => charSets[name]).join("");

  return Array.from({ length }, () => chars[randomInt(chars.length)]).join("");
}

// パスフレーズ用の単語リスト（よく使われすぎる上位1000語は除く）
export const wordList = english.dictionary["commonWords-en"]
  .slice(1000, 10000)
  .filter((word) => /^[a-z]{4,8}$/.test(word));

export function generatePassphrase(count: number): string {
  return Array.from(
    { length: count },
    () => wordList[randomInt(wordList.length)]
  ).join("-");
}

// 候補の総数から求めるエントロピー（ビット）
export function entropyBits(poolSize: number, count: number): number {
  return count * Math.log2(poolSize);
}

export function randomHex(bytes: number): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(bytes)))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
