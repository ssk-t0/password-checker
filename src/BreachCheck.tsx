import { useState } from "react";
import { checkPwned, type PwnedResult } from "./pwned";

type Status = "idle" | "loading" | "done" | "error";

type Props = {
  password: string;
};

function BreachCheck({ password }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<PwnedResult | null>(null);

  async function handleCheck() {
    setStatus("loading");

    try {
      setResult(await checkPwned(password));
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <details className="breach-box">
      <summary>
        漏洩パスワードチェック
        <small>流出データに含まれているか照合</small>
      </summary>

      <p>
        過去に流出したパスワードの一覧（Have I Been Pwned）に
        含まれているかを調べます。送信されるのは
        SHA-1ハッシュの先頭5文字だけで、パスワードそのものは送りません。
      </p>

      {status !== "done" && (
        <button
          type="button"
          className="breach-button"
          onClick={handleCheck}
          disabled={status === "loading"}
        >
          {status === "loading" ? "照合中..." : "漏洩データと照合する"}
        </button>
      )}

      {status === "error" && (
        <p className="breach-error">
          照合に失敗しました。ネットワーク接続を確認してください。
        </p>
      )}

      {status === "done" && result && (
        <>
          <p
            className={
              result.count > 0 ? "breach-result danger" : "breach-result safe"
            }
          >
            {result.count > 0
              ? `⚠ 流出データに ${result.count.toLocaleString("ja-JP")} 回登場しています。辞書攻撃やクレデンシャルスタッフィングで最初に試される可能性が高いです。`
              : "✓ 既知の流出データには見つかりませんでした。"}
          </p>

          <div className="hash-view">
            <span>SHA-1</span>
            <code>
              <mark>{result.prefix}</mark>
              {result.suffix}
            </code>
            <small>
              色付きの5文字だけを送信し、残りの35文字は手元で照合しました。
            </small>
          </div>
        </>
      )}
    </details>
  );
}

export default BreachCheck;
