import type { MatchExtended } from "@zxcvbn-ts/core";

// check()の結果には、各部分の推定試行回数（guessesLog10）も入っている
type Props = {
  sequence: MatchExtended[];
  showPassword: boolean;
};

// 辞書の種類
const dictionaryNames: Record<string, string> = {
  passwords: "よく使われるパスワード",
  commonWords: "一般的な単語",
  firstnames: "人名（名）",
  lastnames: "人名（姓）",
  wikipedia: "Wikipedia頻出語",
  userInputs: "個人情報",
};

// パターンごとの説明と色
function describe(match: MatchExtended): { label: string; color: string } {
  switch (match.pattern) {
    case "dictionary": {
      const base = match.dictionaryName.replace(/-.*$/, "");
      let label = `辞書：${dictionaryNames[base] ?? "単語"}`;
      if (match.l33t) label += "（文字置き換え）";
      if (match.reversed) label += "（逆順）";
      return { label, color: "#ef4444" };
    }
    case "spatial":
      return { label: "キーボード配列", color: "#f97316" };
    case "repeat":
      return { label: "繰り返し", color: "#f97316" };
    case "sequence":
      return { label: "連続した文字", color: "#f97316" };
    case "wordSequence":
      return { label: "決まった単語の並び", color: "#f97316" };
    case "date":
      return { label: "日付", color: "#eab308" };
    case "regex":
      return { label: "西暦", color: "#eab308" };
    case "separator":
      return { label: "区切り文字", color: "#94a3b8" };
    default:
      return { label: "ランダムな部分（総当たり）", color: "#10b981" };
  }
}

function PatternBreakdown({ sequence, showPassword }: Props) {
  // 非表示モードのときは文字を伏せる
  const display = (token: string) =>
    showPassword ? token : "•".repeat([...token].length);

  return (
    <details className="pattern-box">
      <summary>
        どこが推測されやすいか
        <small>パスワードを部分ごとに色分け</small>
      </summary>

      <div className="pattern-token-row">
        {sequence.map((match, index) => (
          <span
            key={index}
            className="pattern-token"
            style={{ borderColor: describe(match).color }}
          >
            {display(match.token)}
          </span>
        ))}
      </div>

      <ul className="pattern-list">
        {sequence.map((match, index) => {
          const { label, color } = describe(match);

          return (
            <li key={index}>
              <span className="pattern-dot" style={{ background: color }} />
              <code>{display(match.token)}</code>
              <span>{label}</span>
              <small>約10^{Math.round(match.guessesLog10)}通り</small>
            </li>
          );
        })}
      </ul>

      <p className="pattern-note">
        赤・オレンジの部分は攻撃者が優先して試すパターンです。
        全体の推定試行回数は、各部分の試行回数の掛け算をもとに計算されます。
      </p>
    </details>
  );
}

export default PatternBreakdown;
