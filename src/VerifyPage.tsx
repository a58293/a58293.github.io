import { useEffect, useRef, useState, type FormEvent } from "react";
import { SplitColorText } from "./components/HoverColorText";
import {requiredImage} from './media-library';
import SiteSearch from './SiteSearch';
import {MobileActions} from './PurchaseMenu';
import "./verify-page.css";
import './soft-ui.css';
import './mobile-ux-redesign.css';
import { verificationApiUrl, verifyAuthenticity, type VerificationResponse } from './verification';

const officialLogo = requiredImage('brandLogo');
const samples = [
  { id: "matched", label: "匹配样例", certificate: "DEMO-FG01-0001", order: "000000000000000001" },
  { id: "unmatched", label: "未匹配样例", certificate: "DEMO-FG01-0002", order: "000000000000000002" },
  { id: "paused", label: "暂缓样例", certificate: "DEMO-FG01-0003", order: "000000000000000003" },
] as const;
type SampleId = (typeof samples)[number]["id"];
type Status = "idle" | "checking" | SampleId;

// This page is a UI demonstration only. No production verification API exists.
// Inputs are read-only and no customer-provided identifiers are collected.
function DemoConsole() {
  const [selected, setSelected] = useState<SampleId>("matched");
  const [status, setStatus] = useState<Status>("idle");
  const timerRef = useRef<number | undefined>(undefined);
  const pendingRef = useRef(false);
  const sample = samples.find(item => item.id === selected)!;

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const preview = (event: FormEvent) => {
    event.preventDefault();
    if (pendingRef.current || status !== "idle") return;
    pendingRef.current = true;
    setStatus("checking");
    timerRef.current = window.setTimeout(() => {
      pendingRef.current = false;
      setStatus(selected);
    }, 480);
  };
  const reset = () => {
    window.clearTimeout(timerRef.current);
    pendingRef.current = false;
    setStatus("idle");
  };
  const isResult = status !== "idle" && status !== "checking";
  const titles = { matched: "演示结果：匹配", unmatched: "演示结果：未匹配", paused: "演示结果：暂缓" };
  const descriptions = {
    matched: "展示未来匹配结果的界面样式，不代表任何真实娃证、订单或实体通过认证。",
    unmatched: "展示未来信息未匹配时的界面样式，不涉及真实客户档案。",
    paused: "展示未来访问暂缓时的界面样式。这里只是样例，不代表已部署服务端限流。",
  };

  return <section className="verify-console" aria-label="核验界面演示">
          <div className="verify-console-head"><span>DEMO / 001</span><i aria-hidden="true" /><b>仅供界面预览</b></div>
          <p className="verify-demo-notice" id="verify-demo-notice"><b>正式核验暂未开放</b><span>以下全部为虚构样例，不能用于实际防伪。</span></p>
          {!isResult ? (
            <form onSubmit={preview} aria-describedby="verify-demo-notice">
              <fieldset className="verify-demo-options" disabled={status === "checking"}>
                <legend>选择演示状态</legend>
                {samples.map(item => <label key={item.id}><input type="radio" name="demo-scenario" value={item.id} checked={selected === item.id} onChange={() => setSelected(item.id)} /><span>{item.label}</span></label>)}
              </fieldset>
              <label>
                <span><b>样例娃证编号</b><small>DEMO CERTIFICATE</small></span>
                <input value={sample.certificate} readOnly autoComplete="off" aria-describedby="certificate-help" />
                <em id="certificate-help">固定虚构编号，不接受真实信息</em>
              </label>
              <div className="verify-plus" aria-hidden="true"><span />＋<span /></div>
              <label>
                <span><b>样例订单号</b><small>DEMO ORDER</small></span>
                <input value={sample.order} readOnly autoComplete="off" aria-describedby="order-help" />
                <em id="order-help">固定虚构订单，仅展示字段排版</em>
              </label>
              <button className="verify-submit" type="submit" disabled={status === "checking"}>{status === "checking" ? "正在准备演示…" : "预览演示结果"}<span aria-hidden="true">↗</span></button>
              <p className="verify-form-meta">DEMO ONLY · NO CUSTOMER DATA</p>
            </form>
          ) : (
            <div className={status === "matched" ? "verify-success" : "verify-failure"} role="status" aria-live="polite">
              <div className="verify-seal" aria-hidden="true"><span>{status === "matched" ? "✓" : status === "paused" ? "!" : "×"}</span><i /></div>
              <p>DEMONSTRATION · NOT A CERTIFICATE</p>
              <h2>{titles[status]}</h2>
              <blockquote>{descriptions[status]}</blockquote>
              <dl>
                <div><dt>样例作品</dt><dd>镜昕 · 荷花女神</dd></div>
                <div><dt>演示编号</dt><dd>{sample.certificate}</dd></div>
                <div><dt>数据性质</dt><dd>虚构样例 · 无认证效力</dd></div>
              </dl>
              <button type="button" onClick={reset}>返回选择样例</button>
            </div>
          )}
          <footer><span>不接收真实娃证或订单</span><span>DEMO ONLY</span></footer>
        </section>;
}

function LiveConsole() {
  const [certificate, setCertificate] = useState("");
  const [order, setOrder] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (checking) return;
    const normalizedCertificate = certificate.normalize("NFKC").trim().toUpperCase().replace(/[\s-]+/g, "");
    const normalizedOrder = order.normalize("NFKC").trim().replace(/[\s-]+/g, "");
    if (!/^[A-Z0-9]{12,32}$/.test(normalizedCertificate) || !/^\d{10,32}$/.test(normalizedOrder)) {
      setResult({ ok: false, result: "invalid_input", message: "请核对娃证编号与订单号格式。" });
      return;
    }
    setChecking(true);
    setResult(null);
    const controller = new AbortController();
    controllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 8000);
    try {
      setResult(await verifyAuthenticity(normalizedCertificate, normalizedOrder, controller.signal));
    } catch {
      setResult({ ok: false, result: "service_unavailable", message: "核验服务暂时不可用，请稍后重试。" });
    } finally {
      window.clearTimeout(timeout);
      setChecking(false);
      controllerRef.current = null;
    }
  };
  const reset = () => { setResult(null); setCertificate(""); setOrder(""); };
  const first = result?.result === "valid_first";
  const repeat = result?.result === "valid_repeat";
  const successful = first || repeat;

  return <section className="verify-console" aria-label="绘屿造物防伪核验">
    <div className="verify-console-head"><span>VERIFY / 001</span><i aria-hidden="true" /><b>官方核验通道</b></div>
    {!result ? <form onSubmit={submit}>
      <label><span><b>娃证编号</b><small>CERTIFICATE</small></span><input value={certificate} onChange={event => setCertificate(event.target.value)} autoComplete="off" inputMode="text" maxLength={40} placeholder="请输入娃证上的唯一编号" required /><em>可忽略编号中的空格与短横线</em></label>
      <div className="verify-plus" aria-hidden="true"><span />＋<span /></div>
      <label><span><b>淘宝订单号</b><small>ORDER NUMBER</small></span><input value={order} onChange={event => setOrder(event.target.value)} autoComplete="off" inputMode="numeric" maxLength={40} placeholder="请输入购买时的淘宝订单号" required /><em>仅用于本次匹配，不在浏览器中保存</em></label>
      <button className="verify-submit" type="submit" disabled={checking}>{checking ? "正在安全核验…" : "开始核验"}<span aria-hidden="true">↗</span></button>
      <p className="verify-form-meta">SECURE LOOKUP · NO BROWSER STORAGE</p>
    </form> : <div className={successful ? "verify-success" : `verify-failure${result.result === "rate_limited" ? " is-limited" : ""}`} role="status" aria-live="polite">
      <div className={`verify-seal${successful ? "" : " verify-seal-failure"}`} aria-hidden="true"><span>{successful ? "✓" : result.result === "rate_limited" ? "!" : "×"}</span><i /></div>
      <p>{successful ? "OFFICIAL VERIFICATION" : "VERIFICATION NOTICE"}</p>
      <h2>{first ? "首次核验通过" : repeat ? "凭证有效 · 已核验" : result.result === "rate_limited" ? "请稍后再试" : "未通过核验"}</h2>
      <blockquote>{result.message}</blockquote>
      {successful && <dl><div><dt>作品</dt><dd>{result.product?.name || "—"} · {result.product?.seriesName || "—"}</dd></div><div><dt>批次 / 序列</dt><dd>{result.product?.batchCode || "—"} / {result.product?.serialNumber || "—"}</dd></div><div><dt>核验记录</dt><dd>{result.verification?.count || 0} 次{repeat && result.verification?.firstVerifiedAt ? ` · 首次 ${new Date(result.verification.firstVerifiedAt).toLocaleString("zh-CN")}` : ""}</dd></div></dl>}
      {!successful && result.requestId && <p className="verify-failure-note">如需客服协助，请提供查询编号：{result.requestId}</p>}
      <button type="button" onClick={reset}>重新核验</button>
    </div>}
    <footer><span>编号与订单须同时匹配</span><span>OFFICIAL CHANNEL</span></footer>
  </section>;
}

export function VerificationConsole() {
  return verificationApiUrl ? <LiveConsole /> : <DemoConsole />;
}

export default function VerifyPage() {
  const live = Boolean(verificationApiUrl);
  useEffect(() => {
    document.body.classList.add("verify-page-active");
    return () => document.body.classList.remove("verify-page-active");
  }, []);
  return <div className="verify-world">
    <header className="mobile-verify-header"><a href="/series/flower-gods">← 花神卷</a><MobileActions/></header>
    <div className="verify-atmosphere" aria-hidden="true"><span /><span /><i /></div>
    <header className="verify-header"><a className="verify-brand" href="/" aria-label="返回绘屿造物首页"><span className="verify-brand-mark"><img className="brand-logo-image" src={officialLogo} alt="" /></span><span><strong>LUMEN AURALIS</strong><small>绘屿造物</small></span></a><p>AUTHENTICITY · {live ? "VERIFICATION" : "DEMONSTRATION"}</p><div className="verify-header-actions"><SiteSearch /><a className="verify-back" href="/series/flower-gods">返回花神卷 <span>↗</span></a></div></header>
    <main className="verify-main"><section className="verify-intro" aria-labelledby="verify-title"><div className="verify-index"><span>01</span><i /><span>{live ? "OFFICIAL VERIFICATION" : "INTERFACE PREVIEW"}</span></div><p className="verify-kicker">绘屿造物 · 身份核验</p><h1 id="verify-title"><span>为真形，</span><SplitColorText text="留下唯一凭证。" /></h1><p className="verify-lead">{live ? "输入娃证编号与购买订单号，查询作品的官方出品记录。首次核验时间会被记录，用于帮助识别异常重复查询。" : "正式核验暂未开放。这里仅展示未来的核验流程，不连接真实档案，也不接收真实娃证或淘宝订单。"}</p><ol className="verify-steps" aria-label="核验流程"><li><span>01</span><div><b>{live ? "输入双重凭证" : "选择虚构样例"}</b><small>{live ? "娃证编号与购买订单同时匹配" : "无需提供任何个人信息"}</small></div></li><li><span>02</span><div><b>{live ? "连接官方档案" : "预览界面状态"}</b><small>{live ? "加密比对，不在浏览器保存" : "匹配、未匹配与访问暂缓"}</small></div></li><li><span>03</span><div><b>{live ? "查看核验记录" : "等待正式开放"}</b><small>{live ? "留意首次时间与重复查询次数" : "服务端档案与安全机制尚待接入"}</small></div></li></ol><div className="verify-trust-note"><i aria-hidden="true">◌</i><p><b>{live ? "安全提示" : "请勿提交真实订单"}</b><span>{live ? "请仅从绘屿造物官网进入核验；核验通过不替代交易平台订单与售后凭证。" : "本页只使用固定虚构样例；不上传、不存储客户订单。演示结果不构成真伪或所有权证明。"}</span></p></div></section>{live ? <LiveConsole /> : <DemoConsole />}</main>
    <footer className="verify-page-footer"><span>© 2026 LUMEN AURALIS · <a href="/legal/authenticity">防伪说明</a></span><span>客服 19988424290 · 工作日 10:00—17:00</span></footer>
  </div>;
}
