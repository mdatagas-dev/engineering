"use client";

import { useRef, useState } from "react";
import { FileSpreadsheet, UploadCloud, CheckCircle2, AlertTriangle, Table2, Save } from "lucide-react";
import { TiltPanel } from "@/components/tilt-panel";
import { PanelHeader } from "@/components/panel-header";
import { muatDariBackend } from "@/lib/store";
import { uploadExcel, commitExcel, type RawDataRow } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

const PREVIEW_COLS: (keyof RawDataRow)[] = [
  "date", "model", "line", "input_qty", "first_pass_good_qty", "defect_qty",
  "planned_minutes", "downtime_minutes", "target_ct_sec", "actual_ct_sec",
  "standard_setup_min", "actual_setup_min",
];

export default function ImporPage() {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ rows: RawDataRow[]; total: number; warnings: string[] } | null>(null);
  const [status, setStatus] = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  const onFile = async (f: File) => {
    setFile(f);
    setLoading(true);
    setStatus(null);
    setPreview(null);
    try {
      const res = await uploadExcel(f);
      setPreview({ rows: res.preview, total: res.total_rows, warnings: res.warnings });
      setStatus({
        type: res.warnings.length ? "err" : "ok",
        msg: t("impor.status.parsed", {
          name: f.name,
          total: res.total_rows,
          warnings: res.warnings.length,
        }),
      });
    } catch (e) {
      setStatus({ type: "err", msg: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const simpan = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const res = await commitExcel();
      await muatDariBackend();
      setStatus({ type: "ok", msg: t("impor.status.committed", { n: res.saved }) });
      setPreview(null);
      setFile(null);
    } catch (e) {
      setStatus({ type: "err", msg: (e as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="anim-fade-up">
        <p className="lux-eyebrow mb-2">{t("menu.input")}</p>
        <h1 className="font-display text-hisense-gradient text-4xl font-bold text-glow lg:text-5xl">{t("impor.title")}</h1>
        <p className="mt-1.5 text-sm text-hisense-soft/75">
          {t("impor.subtitle")}
        </p>
      </header>

      <TiltPanel className="anim-fade-up" intensity={3}>
        <PanelHeader
          icon={<FileSpreadsheet className="h-4 w-4" />}
          title={t("impor.upload.title")}
          subtitle={t("impor.upload.columns", { cols: PREVIEW_COLS.join(", ") })}
        />
        <div className="p-5">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <button
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              const f = e.dataTransfer.files?.[0];
              if (f) onFile(f);
            }}
            className={cn(
              "flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-14 transition-all duration-300",
              drag
                ? "border-hisense/70 bg-hisense/10 shadow-[0_0_40px_rgba(0,179,172,0.15)]"
                : "border-hisense/20 bg-obsidian-900/40 hover:border-hisense/40 hover:bg-hisense/5"
            )}
          >
            {loading ? (
              <>
                <div className="h-12 w-12 animate-spin rounded-full border-2 border-hisense/30 border-t-hisense" />
                <p className="text-sm text-hisense-soft/70">{t("impor.upload.processing")}</p>
              </>
            ) : (
              <>
                <div className="relative">
                  <div className="glow-ring absolute -inset-4 opacity-50" />
                  <UploadCloud className="relative h-12 w-12 text-hisense-soft" />
                </div>
                <p className="text-sm font-medium text-hisense-soft">
                  {file ? file.name : t("impor.upload.dropzone")}
                </p>
                <p className="text-xs text-hisense-soft/40">{t("impor.upload.hint")}</p>
              </>
            )}
          </button>

          {status && (
            <div
              className={cn(
                "mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm",
                status.type === "ok"
                  ? "border-hisense/30 bg-hisense/10 text-hisense-soft"
                  : "border-gold-400/30 bg-gold-400/10 text-gold-300"
              )}
            >
              {status.type === "ok" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-hisense" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              )}
              {status.msg}
            </div>
          )}
        </div>
      </TiltPanel>

      {preview && (
        <TiltPanel className="anim-fade-up" intensity={2}>
          <PanelHeader
            icon={<Table2 className="h-4 w-4" />}
            title={t("impor.preview.title")}
            subtitle={t("impor.preview.subtitle", { total: preview.total, shown: preview.rows.length })}
            right={
              <button
                onClick={simpan}
                disabled={loading}
                className="shine-sweep relative flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-hisense-bold via-hisense to-hisense-soft px-4 py-2 text-xs font-bold text-obsidian-950 shadow-hisense-glow transition-all hover:shadow-hisense-glow disabled:opacity-40"
              >
                <Save className="h-3.5 w-3.5" /> {t("impor.preview.saveRows", { n: preview.total })}
              </button>
            }
          />
          <div className="overflow-x-auto px-5 pb-5 pt-4">
            {preview.warnings.length > 0 && (
              <div className="mb-4 rounded-xl border border-gold-400/25 bg-gold-400/5 px-4 py-3 text-xs text-gold-300/80">
                {preview.warnings.map((w, i) => (
                  <p key={i}>{w}</p>
                ))}
              </div>
            )}
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-hisense/15 text-[10px] uppercase tracking-wider text-hisense-soft/75">
                  {PREVIEW_COLS.map((c) => (
                    <th key={c} className="pb-2.5 pr-4 font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((r, i) => (
                  <tr key={i} className="border-b border-hisense/8 hover:bg-hisense/5">
                    {PREVIEW_COLS.map((c) => (
                      <td key={c} className="py-2.5 pr-4 font-mono text-hisense-soft/70">{String(r[c])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TiltPanel>
      )}
    </div>
  );
}
