
import { useEffect, useMemo, useState } from "react";
import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import * as common from "@zxcvbn-ts/language-common";
import * as english from "@zxcvbn-ts/language-en";
import "./App.css";

// パスワード解析エンジン
const zxcvbn = new ZxcvbnFactory({
  dictionary: {
    ...common.dictionary,
    ...english.dictionary,
  },
  graphs: common.adjacencyGraphs,
  translations: english.translations,
});

// 秒数を日本語に変換
function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds)) return "非常に長い時間";
  if (seconds < 1) return "1秒未満";
  if (seconds < 60) return `約${Math.ceil(seconds)}秒`;
  if (seconds < 3600) return `約${Math.ceil(seconds / 60)}分`;
  if (seconds < 86400) return `約${Math.ceil(seconds / 3600)}時間`;
  if (seconds < 2592000) return `約${Math.ceil(seconds / 86400)}日`;
  if (seconds < 31536000)
    return `約${Math.ceil(seconds / 2592000)}か月`;

  const years = seconds / 31536000;
  if (years > 10000) return "1万年以上";

  return `約${Math.ceil(years).toLocaleString("ja-JP")}年`;
}

type Phase = "idle" | "running" | "complete";

function App() {


  // 入力途中のパスワード
  const [password, setPassword] = useState("");

  // 設定ボタンを押した時点のパスワード
  const [target, setTarget] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [runId, setRunId] = useState(0);

  const [overlayDismissed, setOverlayDismissed] = useState(false);

  // 設定されたパスワードだけ解析する
  const result = useMemo(() => {
    return target ? zxcvbn.check(target) : null;
  }, [target]);

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
    "#10b981",
  ];

  // 入力を変更したらシミュレーションをリセット
  function handlePasswordChange(value: string) {
    setPassword(value);
    setTarget("");
    setPhase("idle");
    setProgress(0);
  }

  // 攻撃シミュレーション開始
  function startSimulation() {
    if (!password || phase === "running") return;
    setOverlayDismissed(false);
    setTarget(password);
    setProgress(0);
    setPhase("running");
    setRunId((id) => id + 1);
  }

  // シミュレーションアニメーション
  useEffect(() => {
    if (!target || phase !== "running") return;

    let current = 0;

    const timer = window.setInterval(() => {
      current = Math.min(current + 2, 100);
      setProgress(current);

      if (current >= 100) {
        window.clearInterval(timer);
        setPhase("complete");
      }
    }, 140);

    return () => window.clearInterval(timer);
  }, [target, runId, phase]);

  // 解析されたパターン
  const patterns = useMemo(() => {
    return result
      ? result.sequence.map((item) => item.pattern)
      : [];
  }, [result]);

  // 表示するログ
  const logs = [
    { at: 0, text: "[SYSTEM] Simulation initialized" },
    { at: 8, text: "[SCAN] Loading dictionary patterns..." },
    { at: 18, text: "[SCAN] Analyzing common passwords..." },
    {
      at: 30,
      text: patterns.includes("dictionary")
        ? "[WARNING] Dictionary pattern detected"
        : "[OK] Dictionary pattern scan finished",
    },
    { at: 42, text: "[SCAN] Checking repeated characters..." },
    {
      at: 55,
      text: patterns.includes("repeat")
        ? "[WARNING] Repeated pattern detected"
        : "[OK] Repetition scan finished",
    },
    { at: 67, text: "[SCAN] Checking sequential patterns..." },
    {
      at: 75,
      text: patterns.includes("sequence")
        ? "[WARNING] Sequential pattern detected"
        : "[OK] Sequence scan finished",
    },
    { at: 85, text: "[SCAN] Estimating crack times..." },
    { at: 95, text: "[RESULT] Preparing security report..." },
    { at: 100, text: "[SYSTEM] Simulation completed" },
  ];

  const visibleLogs = logs.filter(
    (log) => log.at <= progress
  );

  // 架空の候補文字列（演出のみ）
  const demoCandidate =
    "DEMO-" +
    String((progress * 7919) % 999999).padStart(6, "0");

  // 推定突破時間
  const attacks = result
    ? [
        {
          name: "オンライン攻撃・制限あり",
          time: formatTime(
            result.crackTimes.onlineThrottlingXPerHour.seconds
          ),
          description: "試行回数が制限されるログイン",
        },
        {
          name: "オンライン攻撃・制限なし",
          time: formatTime(
            result.crackTimes.onlineNoThrottlingXPerSecond.seconds
          ),
          description: "試行制限がないログイン",
        },
        {
          name: "オフライン攻撃・低速ハッシュ",
          time: formatTime(
            result.crackTimes.offlineSlowHashingXPerSecond.seconds
          ),
          description: "流出した低速ハッシュの照合",
        },
        {
          name: "オフライン攻撃・高速ハッシュ",
          time: formatTime(
            result.crackTimes.offlineFastHashingXPerSecond.seconds
          ),
          description: "高速なハッシュ照合",
        },
      ]
    : [];

  return (
    <main className="app-shell">

      {/* 上側：パスワード設定 */}
      <section className="checker-card">
        <div className="section-heading">
          <span className="eyebrow">PASSWORD SECURITY LAB</span>

          <h1>パスワードセキュリティチェッカー</h1>

          <p className="subtitle">
            パスワードを設定すると、攻撃者視点の
            セキュリティ分析が始まります。
          </p>
        </div>

        <label className="input-label" htmlFor="password">
          パスワードを設定
        </label>

        <div className="input-wrapper">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            placeholder="テスト用パスワードを入力"
            autoComplete="off"
            spellCheck={false}
            onChange={(e) =>
              handlePasswordChange(e.target.value)
            }
          />

          <button
            type="button"
            className="visibility-button"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? "隠す" : "表示"}
          </button>
        </div>

        <button
          type="button"
          className="start-button"
          onClick={startSimulation}
          disabled={!password || phase === "running"}
        >
          {phase === "running"
            ? "シミュレーション実行中..."
            : phase === "complete"
            ? "もう一度シミュレーション"
            : "設定して攻撃シミュレーション開始 →"}
        </button>

        <div className="strength-heading">
          <span>セキュリティ判定</span>
          <strong
            style={{
              color: result && phase === "complete"
                ? colors[score]
                : "#94a3b8",
            }}
          >
            {phase === "complete" && result
              ? labels[score]
              : phase === "running"
              ? "解析中..."
              : "未解析"}
          </strong>
        </div>

        <div className="strength-bar">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              className="segment"
              key={level}
              style={{
                backgroundColor:
                  phase === "complete" &&
                  result &&
                  score >= level
                    ? colors[score]
                    : "#e2e8f0",
              }}
            />
          ))}
        </div>

        <div className="info-grid">
          <div className="info-box">
            <span>文字数</span>
            <strong>{password.length}文字</strong>
          </div>

          <div className="info-box">
            <span>強度スコア</span>
            <strong>
              {phase === "complete" && result
                ? `${score} / 4`
                : "---"}
            </strong>
          </div>

          <div className="info-box">
            <span>推定試行回数</span>
            <strong>
              {phase === "complete" && result
                ? result.guesses.toLocaleString("ja-JP")
                : "---"}
            </strong>
          </div>
        </div>

        {phase === "complete" && result && (
          <div className="advice-box">
            <h3>セキュリティ分析結果</h3>
            <p>
              {score <= 1
                ? "推測されやすいパスワードです。一般的な単語や連番を避け、より長く予測しにくいパスワードを使いましょう。"
                : score === 2
                ? "一定の強度がありますが、改善できます。長く予測しにくいパスフレーズを検討しましょう。"
                : "比較的推測されにくいパスワードです。使い回しを避け、多要素認証も利用しましょう。"}
            </p>
          </div>
        )}

        <p className="privacy-note">
          学習用のため、実際に使用中のパスワードは入力しないでください。
        </p>
      </section>

      {/* 下側：攻撃シミュレーター */}
      <section className="attacker-card hacker-terminal">

        <div className="terminal-header">
          <div className="window-controls">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
          </div>

          <span className="terminal-title">
            ATTACK SIMULATOR / LOCAL
          </span>

          <span className="live-indicator">
            <span className="live-dot"></span>
            {phase === "idle"
              ? "STANDBY"
              : phase === "running"
              ? "RUNNING"
              : "COMPLETE"}
          </span>
        </div>

        <div className="hacker-dashboard">
          <div className="hacker-topline">
            <span>SECURITY ANALYSIS ENGINE</span>
            <span>SIMULATION MODE</span>
          </div>

          <div className="hacker-stats">
            <div>
              <small>STATUS</small>
              <strong>
                {phase === "idle"
                  ? "WAITING"
                  : phase === "running"
                  ? "SCANNING"
                  : "FINISHED"}
              </strong>
            </div>

            <div>
              <small>PROGRESS</small>
              <strong>{progress}%</strong>
            </div>

            <div>
              <small>RESULT</small>
              <strong>
                {phase === "complete"
                  ? "READY"
                  : "---"}
              </strong>
            </div>
          </div>

          <div className="hacker-screen">
            <div className="scanlines"></div>

            {phase === "idle" ? (
              <>
                <p className="terminal-idle">
                  &gt; SYSTEM READY
                </p>
                <p className="terminal-idle">
                  &gt; WAITING FOR PASSWORD SETUP_
                </p>
              </>
            ) : (
              <>
                {visibleLogs.map((log, index) => (
                  <div
                    className={`hacker-log ${
                      log.text.includes("WARNING")
                        ? "log-warning"
                        : "log-normal"
                    }`}
                    key={index}
                  >
                    <span className="log-prefix">
                      {String(log.at).padStart(3, "0")}%
                    </span>
                    <span>{log.text}</span>
                  </div>
                ))}

                {phase === "running" && (
                  <div className="hacker-log live-candidate">
                    <span className="log-prefix">SIM</span>
                    <span>
                      &gt; candidate: {demoCandidate}
                      <span className="hacker-cursor"> █</span>
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="scan-progress">
            <div className="scan-progress-label">
              <span>ANALYSIS PROGRESS</span>
              <strong>{progress}%</strong>
            </div>

            <div className="scan-track">
              <div
                className="scan-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

        </div>

        {/* 解析完了後だけ結果を表示 */}
        {phase === "complete" && result && (
          <div className="attack-summary">

            <div className="simulation-result">
              <span>ANALYSIS COMPLETE</span>

              <h2>
                {score <= 1
                  ? "このパスワードは推測されやすい可能性があります"
                  : score === 2
                  ? "このパスワードには改善の余地があります"
                  : "このパスワードは比較的推測されにくいと評価されました"}
              </h2>

              <p>
                実際に突破した結果ではなく、
                攻撃条件に基づいた推定評価です。
              </p>
            </div>

            <div className="summary-heading">
              <h2>攻撃シナリオ別の推定突破時間</h2>
              <p>
                同じパスワードでも、攻撃方法や環境で
                推定突破時間が大きく変わります。
              </p>
            </div>

            <div className="attack-grid">
              {attacks.map((attack, index) => (
                <div className="attack-box" key={attack.name}>
                  <div className="attack-number">
                    ATTACK SCENARIO 0{index + 1}
                  </div>

                  <h3>{attack.name}</h3>
                  <p>{attack.description}</p>
                  <strong>{attack.time}</strong>
                </div>
              ))}
            </div>

            <p className="disclaimer">
              この画面は学習用シミュレーションです。
              ログや候補文字列は演出であり、
              パスワードへの実際の攻撃や突破は行っていません。
              推定時間はzxcvbnの仮定に基づきます。
            </p>
          </div>
        )}
      </section>


{/* 全画面の模擬乗っ取り演出 */}
{phase === "running" &&
  progress >= 6 &&
  !overlayDismissed && (
    <div className="takeover-overlay" role="dialog"
      aria-label="セキュリティ攻撃シミュレーション">

      <div className="takeover-scanlines" />

      <div className="takeover-content">
        <div className="takeover-top">
          <span>SECURITY LAB / SIMULATION</span>
          <button
            type="button"
            className="takeover-close"
            onClick={() => setOverlayDismissed(true)}
          >
            演出を閉じる ×
          </button>
        </div>

        <div className="takeover-warning">
          <span className="takeover-icon">⚠</span>
          <h2 className="takeover-glitch">
            SYSTEM BREACH
          </h2>
          <p>パスワード攻撃シミュレーション実行中</p>
        </div>

        <div className="takeover-console">
          {visibleLogs.map((log, index) => (
            <p key={index}>
              <span>[{String(log.at).padStart(3, "0")}%]</span>
              {" "}{log.text}
            </p>
          ))}

          <p className="takeover-candidate">
            &gt; SIMULATED CANDIDATE:
            {" "}{demoCandidate}
          </p>
        </div>

        <div className="takeover-progress-label">
          <span>ATTACK ANALYSIS</span>
          <strong>{progress}%</strong>
        </div>

        <div className="takeover-track">
          <div
            className="takeover-fill"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="takeover-notice">
          TRAINING MODE — 実際の侵入や攻撃は行っていません
        </p>
      </div>
    </div>
  )}

    </main>
  );
}

export default App;
