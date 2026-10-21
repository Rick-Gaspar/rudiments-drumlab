import { useState } from "react";
import { RUDIMENTS } from "@/data/rudiments";
import { BPM_MAX, BPM_MIN, NOTES_MAX, parseForm, type FormErrors, type SessionFormValues, type SessionInput } from "@/lib/sessions/model";
import { cn } from "@/lib/utils";

const RATINGS = ["Muito fácil", "Fácil", "Média", "Difícil", "Muito difícil"];

export function SessionForm({
  values, onChange, onSubmit, onCancel, cancelLabel = "Cancelar", lockRudiment = false, submitLabel = "Salvar sessão",
}: {
  values: SessionFormValues;
  onChange: (v: SessionFormValues) => void;
  onSubmit: (input: SessionInput) => Promise<void>;
  onCancel: () => void;
  cancelLabel?: string;
  lockRudiment?: boolean;
  submitLabel?: string;
}) {
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const set = (k: keyof SessionFormValues) => (e: { target: { value: string } }) => onChange({ ...values, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    const r = parseForm(values);
    if (!r.ok) return setErrors(r.errors);
    setErrors({});
    setSaving(true);
    try {
      await onSubmit(r.input);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const field = "mt-1 h-11 w-full rounded-lg border bg-background px-3 font-mono text-sm";
  const Err = ({ k }: { k: keyof SessionFormValues }) =>
    errors[k] ? <p id={`err-${k}`} className="mt-1 text-xs text-destructive">{errors[k]}</p> : null;
  const aria = (k: keyof SessionFormValues) => ({ "aria-invalid": !!errors[k], "aria-describedby": errors[k] ? `err-${k}` : undefined });

  return (
    <form onSubmit={submit} noValidate className="space-y-4 text-sm">
      <label className="block">
        <span className="text-muted-foreground">Rudimento</span>
        <select value={values.rudimentId} onChange={set("rudimentId")} disabled={lockRudiment} className={cn(field, "font-sans")} {...aria("rudimentId")}>
          {RUDIMENTS.map((r) => <option key={r.id} value={r.id}>{r.order}. {r.name}</option>)}
        </select>
        <Err k="rudimentId" />
      </label>
      <label className="block">
        <span className="text-muted-foreground">Início (data e hora)</span>
        <input type="datetime-local" required value={values.startedAt} onChange={set("startedAt")} className={field} {...aria("startedAt")} />
        <Err k="startedAt" />
      </label>
      <fieldset>
        <legend className="text-muted-foreground">Duração</legend>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <label><span className="sr-only">Minutos</span>
            <div className="flex items-center gap-2"><input inputMode="numeric" value={values.minutes} onChange={set("minutes")} className={field} {...aria("minutes")} /><span>min</span></div>
          </label>
          <label><span className="sr-only">Segundos</span>
            <div className="flex items-center gap-2"><input inputMode="numeric" value={values.seconds} onChange={set("seconds")} className={field} {...aria("seconds")} /><span>s</span></div>
          </label>
        </div>
        <Err k="minutes" /><Err k="seconds" />
      </fieldset>
      <div className="grid grid-cols-3 gap-2">
        {([["startBpm", "BPM inicial"], ["finalBpm", "BPM final *"], ["cleanBpm", "BPM limpo"]] as const).map(([k, l]) => (
          <label key={k} className="block">
            <span className="text-muted-foreground">{l}</span>
            <input inputMode="numeric" placeholder={k === "finalBpm" ? "" : "opcional"} value={values[k]} onChange={set(k)} className={field} {...aria(k)} />
          </label>
        ))}
      </div>
      <Err k="startBpm" /><Err k="finalBpm" /><Err k="cleanBpm" />
      <p className="-mt-2 text-xs text-muted-foreground">
        BPM entre {BPM_MIN} e {BPM_MAX}. <strong>BPM limpo</strong> é informado por você: o maior andamento que tocou sem erros. O app não mede isso.
      </p>
      <fieldset>
        <legend className="text-muted-foreground">Dificuldade percebida (opcional)</legend>
        <div role="radiogroup" className="mt-1 grid grid-cols-5 gap-1">
          {RATINGS.map((l, i) => {
            const v = String(i + 1);
            const on = values.rating === v;
            return (
              <button key={v} type="button" role="radio" aria-checked={on} aria-label={l} title={l}
                onClick={() => onChange({ ...values, rating: on ? "" : v })}
                className={cn("h-11 rounded-lg border font-mono", on ? "border-primary bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                {v}
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">1 = muito fácil · 5 = muito difícil</p>
      </fieldset>
      <label className="block">
        <span className="text-muted-foreground">Notas (opcional)</span>
        <textarea value={values.notes} onChange={set("notes")} maxLength={NOTES_MAX} rows={2} className="mt-1 w-full rounded-lg border bg-background p-3" {...aria("notes")} />
        <Err k="notes" />
      </label>
      {saveError && <p role="alert" className="rounded-lg bg-destructive/15 p-3 text-destructive">Erro ao salvar: {saveError} Seus dados continuam no formulário.</p>}
      {Object.keys(errors).length > 0 && <p role="alert" className="text-destructive">Corrija os campos destacados.</p>}
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={onCancel} className="h-12 rounded-xl bg-secondary font-semibold">{cancelLabel}</button>
        <button type="submit" disabled={saving} className="h-12 rounded-xl bg-primary font-semibold text-primary-foreground disabled:opacity-50">
          {saving ? "Salvando…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
