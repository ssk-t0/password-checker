import { useEffect, useState } from "react";
import { randomHex } from "./random";

type Props = {
  password: string;
};

type Benchmark = {
  fast: number;
  slow: number;
};

const PBKDF2_ITERATIONS = 100000;

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// PBKDF2：ハッシュ計算を何万回も繰り返して、わざと遅くする
async function pbkdf2(password: string, salt: string): Promise<void> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: new TextEncoder().encode(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    256
  );
}

// 1秒あたりに何回ハッシュを計算できるかを、このブラウザで実測する
async function runBenchmark(password: string): Promise<Benchmark> {
  let fastCount = 0;
  const fastStart = performance.now();
  while (performance.now() - fastStart < 500) {
    await sha256(password + fastCount);
    fastCount++;
  }
  const fast = fastCount / ((performance.now() - fastStart) / 1000);

  let slowCount = 0;
  const slowStart = performance.now();
  while (performance.now() - slowStart < 500 || slowCount < 2) {
    await pbkdf2(password, String(slowCount));
    slowCount++;
  }
  const slow = slowCount / ((performance.now() - slowStart) / 1000);

  return { fast, slow };
}

function HashLab({ password }: Props) {
  const [plainHash, setPlainHash] = useState("");
  const [salt, setSalt] = useState(() => randomHex(8));
  const [saltedHash, setSaltedHash] = useState("");
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null);
  const [measuring, setMeasuring] = useState(false);

  useEffect(() => {
    sha256(password).then(setPlainHash);
  }, [password]);

  useEffect(() => {
    sha256(salt + password).then(setSaltedHash);
  }, [password, salt]);

  async function handleBenchmark() {
    setMeasuring(true);
    setBenchmark(await runBenchmark(password));
    setMeasuring(false);
  }

  return (
    <details className="pattern-box hash-lab">
      <summary>
        ハッシュとソルトの実験
        <small>パスワードを守る仕組みを体験</small>
      </summary>

      <p className="pattern-note">
        サービス側はパスワードをそのまま保存せず、ハッシュ値に変換して保存します。
        流出したときに攻撃者が手にするのは、このハッシュ値です。
      </p>

      <div className="hash-view">
        <span>ソルトなし SHA-256</span>
        <code>{plainHash}</code>
        <small>
          同じパスワードなら、誰が使っても毎回同じ値になります。
          よく使われるパスワードのハッシュを事前に計算しておけば、
          表を引くだけで元のパスワードが分かります（レインボーテーブル攻撃）。
        </small>
      </div>

      <div className="hash-view">
        <span>ソルトあり SHA-256</span>
        <code>
          <mark>{salt}</mark> + パスワード → {saltedHash}
        </code>
        <small>
          ユーザーごとにランダムなソルトを加えると、同じパスワードでもハッシュ値が変わります。
          事前に計算した表が使えなくなります。
        </small>
        <button
          type="button"
          className="hash-salt-button"
          onClick={() => setSalt(randomHex(8))}
        >
          ソルトを作り直す ↻
        </button>
      </div>

      <div className="hash-view">
        <span>高速ハッシュと低速ハッシュの速度比較</span>

        {benchmark ? (
          <div className="benchmark-grid">
            <div>
              <small>SHA-256（高速）</small>
              <strong>
                約{Math.round(benchmark.fast).toLocaleString("ja-JP")}回/秒
              </strong>
            </div>
            <div>
              <small>PBKDF2 {PBKDF2_ITERATIONS.toLocaleString("ja-JP")}回（低速）</small>
              <strong>
                約{benchmark.slow.toFixed(1)}回/秒
              </strong>
            </div>
            <p>
              低速ハッシュは約
              {Math.round(benchmark.fast / benchmark.slow).toLocaleString("ja-JP")}
              倍遅く、同じ時間で試せる候補がその分だけ減ります。
              攻撃シナリオの「高速ハッシュ」「低速ハッシュ」の差はこの違いです。
            </p>
          </div>
        ) : (
          <button
            type="button"
            className="breach-button"
            onClick={handleBenchmark}
            disabled={measuring}
          >
            {measuring ? "計測中..." : "このブラウザで計測する"}
          </button>
        )}

        <small>
          ※ブラウザでの計測値です。攻撃者はGPUを使い、SHA-256なら1秒間に数十億回以上試せると言われています。
        </small>
      </div>
    </details>
  );
}

export default HashLab;
