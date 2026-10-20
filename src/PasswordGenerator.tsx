import { useState } from "react";
import {
  charSets,
  entropyBits,
  generatePassphrase,
  generatePassword,
  wordList,
  type CharSetName,
} from "./random";

type Mode = "random" | "passphrase";

type Props = {
  onUse: (password: string) => void;
};

const setLabels: Record<CharSetName, string> = {
  lower: "小文字",
  upper: "大文字",
  digits: "数字",
  symbols: "記号",
};

function PasswordGenerator({ onUse }: Props) {
  const [mode, setMode] = useState<Mode>("random");
  const [length, setLength] = useState(16);
  const [wordCount, setWordCount] = useState(4);
  const [sets, setSets] = useState<CharSetName[]>([
    "lower",
    "upper",
    "digits",
    "symbols",
  ]);
  const [generated, setGenerated] = useState("");

  function toggleSet(name: CharSetName) {
    setSets((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
    );
  }

  function handleGenerate() {
    setGenerated(
      mode === "random"
        ? generatePassword(length, sets)
        : generatePassphrase(wordCount)
    );
  }

  // 攻撃者が「作り方」を知っていても、残る候補の数
  const poolSize =
    mode === "random"
      ? sets.reduce((sum, name) => sum + charSets[name].length, 0)
      : wordList.length;

  const bits = Math.round(
    entropyBits(poolSize, mode === "random" ? length : wordCount)
  );

  return (
    <details className="generator-box">
      <summary>パスワードを自動生成する</summary>

      <div className="generator-tabs">
        <button
          type="button"
          className={mode === "random" ? "active" : ""}
          onClick={() => setMode("random")}
        >
          ランダム文字列
        </button>
        <button
          type="button"
          className={mode === "passphrase" ? "active" : ""}
          onClick={() => setMode("passphrase")}
        >
          パスフレーズ
        </button>
      </div>

      {mode === "random" ? (
        <>
          <label className="generator-range">
            文字数：{length}
            <input
              type="range"
              min={8}
              max={32}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
            />
          </label>

          <div className="generator-sets">
            {(Object.keys(charSets) as CharSetName[]).map((name) => (
              <label key={name}>
                <input
                  type="checkbox"
                  checked={sets.includes(name)}
                  onChange={() => toggleSet(name)}
                />
                {setLabels[name]}
              </label>
            ))}
          </div>
        </>
      ) : (
        <label className="generator-range">
          単語数：{wordCount}
          <input
            type="range"
            min={3}
            max={7}
            value={wordCount}
            onChange={(e) => setWordCount(Number(e.target.value))}
          />
        </label>
      )}

      <p className="generator-entropy">
        {mode === "random"
          ? `${poolSize}種類の文字 × ${length}文字`
          : `${wordList.length.toLocaleString("ja-JP")}語の単語リスト × ${wordCount}語`}
        {" "}＝ 約{bits}ビット（2^{bits}通り）
      </p>

      <button
        type="button"
        className="breach-button"
        onClick={handleGenerate}
        disabled={mode === "random" && sets.length === 0}
      >
        生成する
      </button>

      {generated && (
        <div className="generator-output">
          <code>{generated}</code>
          <button type="button" onClick={() => onUse(generated)}>
            これを使う
          </button>
        </div>
      )}

      <p className="pattern-note">
        生成には暗号学的に安全な乱数（crypto.getRandomValues）を使っています。
        パスフレーズは単語なのでzxcvbnの評価は控えめになりますが、
        単語リストが知られていても候補の数は十分に多くなります。
      </p>
    </details>
  );
}

export default PasswordGenerator;
