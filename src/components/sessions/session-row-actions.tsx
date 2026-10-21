import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SessionForm } from "./session-form";
import { toFormValues, type PracticeSession } from "@/lib/sessions/model";
import { deleteSession, updateSession } from "@/lib/sessions/store";
import { toast } from "sonner";

export function SessionRowActions({ session }: { session: PracticeSession }) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(() => toFormValues(session));
  const [confirm, setConfirm] = useState(false);

  const remove = async () => {
    try {
      await deleteSession(session.id);
      toast.success("Sessão apagada.");
    } catch (e) {
      toast.error(`Não foi possível apagar: ${e instanceof Error ? e.message : "erro"}`);
    }
  };

  return (
    <span className="flex gap-1">
      <button type="button" aria-label="Editar sessão" className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={() => { setValues(toFormValues(session)); setEditing(true); }}>
        <Pencil className="h-4 w-4" />
      </button>
      <button type="button" aria-label="Apagar sessão" className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-destructive" onClick={() => setConfirm(true)}>
        <Trash2 className="h-4 w-4" />
      </button>
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar sessão</DialogTitle></DialogHeader>
          <SessionForm values={values} onChange={setValues} onCancel={() => setEditing(false)} submitLabel="Salvar alterações"
            onSubmit={async (input) => { await updateSession(session.id, input); setEditing(false); toast.success("Sessão atualizada."); }} />
        </DialogContent>
      </Dialog>
      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar esta sessão?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita. As estatísticas serão recalculadas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={remove}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </span>
  );
}
