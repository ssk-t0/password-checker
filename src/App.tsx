import { useState } from "react";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as english from "@zxcvbn-ts/language-en";
import "./App.css";

// パスワード解析用の辞書を設定
const zxcvbn = new ZxcvbnFactory({
  dictionary: {
    ...common.dictionary,
    ...english.dictionary,
  },
  graphs: common.adjacencyGraphs,
  translations: english.translations,
});

function App() {
  const [password, setPassword] = useState("");

  // zxcvbnでパスワードを解析
  const result = password
    ? zxcvbn.check(password)
    : null;

  const score = result?.score ?? 0;

  const labels = [
    "非常に弱い",
    "弱い",
    "普通",
    "強い",
    "非常に強い",
  ];

  const colors = [
    "#ef4444",
    "#f97316",
    "#eab308",
    "#3b82f6",
    "#22c55e",
  ];

  return (
    <main className="checker">
      <h1>パスワードセキュリティチェッカー</h1>

      <input
        type="password"
        placeholder="テスト用パスワードを入力"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <div className="strength-bar">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="segment"
            style={{
              backgroundColor:
                result && score >= level
                  ? colors[score]
                  : "#e5e7eb",
            }}
          />
        ))}
      </div>

      <p>
        判定：{result ? labels[score] : "未入力"}
      </p>

      <p>文字数：{password.length}</p>

      {result && (
        <>
          <p>
            推定試行回数：
            {result.guesses.toLocaleString("ja-JP")}
          </p>

          <h3>なぜこの強度なの？</h3>

          <p>
            {score <= 1
              ? "推測されやすいパターンが含まれている可能性があります。"
              : score === 2
              ? "一定の強度がありますが、改善の余地があります。"
              : "比較的推測されにくいパスワードです。"}
          </p>

          <h3>改善アドバイス</h3>

          <p>
            {score <= 2
              ? "文字数を増やし、予測しにくい単語の組み合わせを使いましょう。"
              : "パスワードの使い回しを避け、サービスごとに異なるものを設定しましょう。"}
          </p>
        </>
      )}
    </main>
  );
}

export default App;