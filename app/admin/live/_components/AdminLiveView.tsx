/* eslint-disable prettier/prettier */
"use client";

import { useCallback, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Radio,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  getAdminLiveStreams,
  createLiveStream,
  toggleLiveStream,
  deleteLiveStream,
  triggerSyncResults,
  type LiveStreamRow,
} from "@/actions/admin-live-streams";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/pt-br";

dayjs.extend(relativeTime);
dayjs.locale("pt-br");

// ─── ESPN Team abbreviations ──────────────────────────────────────────────────

const ESPN_TEAMS = [
  { abbr: "ARG", name: "Argentina" },
  { abbr: "AUS", name: "Austrália" },
  { abbr: "AUT", name: "Áustria" },
  { abbr: "BEL", name: "Bélgica" },
  { abbr: "BIH", name: "Bósnia" },
  { abbr: "BRA", name: "Brasil" },
  { abbr: "CAN", name: "Canadá" },
  { abbr: "COD", name: "Congo DR" },
  { abbr: "COL", name: "Colômbia" },
  { abbr: "CPV", name: "Cabo Verde" },
  { abbr: "CIV", name: "Costa do Marfim" },
  { abbr: "CRO", name: "Croácia" },
  { abbr: "DZA", name: "Argélia" },
  { abbr: "ECU", name: "Equador" },
  { abbr: "EGY", name: "Egito" },
  { abbr: "ENG", name: "Inglaterra" },
  { abbr: "ESP", name: "Espanha" },
  { abbr: "FRA", name: "França" },
  { abbr: "GER", name: "Alemanha" },
  { abbr: "GHA", name: "Gana" },
  { abbr: "JPN", name: "Japão" },
  { abbr: "MAR", name: "Marrocos" },
  { abbr: "MEX", name: "México" },
  { abbr: "NED", name: "Holanda" },
  { abbr: "NOR", name: "Noruega" },
  { abbr: "PAR", name: "Paraguai" },
  { abbr: "POR", name: "Portugal" },
  { abbr: "RSA", name: "África do Sul" },
  { abbr: "SEN", name: "Senegal" },
  { abbr: "SUI", name: "Suíça" },
  { abbr: "SWE", name: "Suécia" },
  { abbr: "USA", name: "EUA" },
] as const;

// ─── Form schema ─────────────────────────────────────────────────────────────

const formSchema = z.object({
  youtube_video_id: z
    .string()
    .min(1, "Obrigatório")
    .regex(/^[a-zA-Z0-9_-]{11}$/, "ID do YouTube inválido (deve ter 11 caracteres)"),
  label: z.string().min(1, "Obrigatório").max(50, "Máximo 50 caracteres"),
  team_hint: z.string().optional(),
  match_id: z.string().regex(/^\d*$/, "Só números").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

// ─── Sync result type ─────────────────────────────────────────────────────────

interface SyncResult {
  syncedResults: number;
  linkedStreams: number;
  live: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AdminLiveView() {
  const queryClient = useQueryClient();
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, startSyncTransition] = useTransition();

  // ── Fetch streams ──────────────────────────────────────────────────────────
  const {
    data: streams,
    isLoading,
    error: fetchError,
  } = useQuery<LiveStreamRow[]>({
    queryKey: ["admin-live-streams"],
    queryFn: async () => {
      const result = await getAdminLiveStreams();
      if ("success" in result && result.success === false) throw new Error(result.error);
      return result as LiveStreamRow[];
    },
    refetchInterval: 30_000,
  });

  // ── Create stream ──────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createLiveStream,
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["admin-live-streams"] });
        queryClient.invalidateQueries({ queryKey: ["live-streams"] });
        reset();
      }
    },
  });

  // ── Toggle stream ──────────────────────────────────────────────────────────
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      toggleLiveStream(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-live-streams"] });
      queryClient.invalidateQueries({ queryKey: ["live-streams"] });
    },
  });

  // ── Delete stream ──────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteLiveStream,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-live-streams"] });
      queryClient.invalidateQueries({ queryKey: ["live-streams"] });
    },
  });

  // ── Form ───────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { youtube_video_id: "", label: "CazéTV", team_hint: "", match_id: "" },
  });

  const teamHintValue = watch("team_hint");

  const onSubmit = useCallback(
    (values: FormValues) => {
      createMutation.mutate({
        youtube_video_id: values.youtube_video_id,
        label: values.label,
        team_hint: values.team_hint || undefined,
        match_id: values.match_id || undefined,
      });
    },
    [createMutation],
  );

  // ── Manual sync ────────────────────────────────────────────────────────────
  const handleSync = useCallback(() => {
    setSyncResult(null);
    setSyncError(null);
    startSyncTransition(async () => {
      const result = await triggerSyncResults();
      if (result.success) {
        setSyncResult(result.data as SyncResult);
        queryClient.invalidateQueries({ queryKey: ["admin-live-streams"] });
        queryClient.invalidateQueries({ queryKey: ["live-streams"] });
      } else {
        setSyncError(result.error ?? "Erro desconhecido");
      }
    });
  }, [queryClient]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (fetchError) {
    const msg = fetchError instanceof Error ? fetchError.message : "Erro";
    if (msg === "Forbidden") {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <ShieldAlert className="h-12 w-12 text-destructive" />
          <h1 className="text-2xl font-bold">Acesso negado</h1>
          <p className="text-muted-foreground">Esta página é restrita ao administrador.</p>
        </div>
      );
    }
  }

  const activeStreams = streams?.filter((s) => s.is_active) ?? [];
  const inactiveStreams = streams?.filter((s) => !s.is_active) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <Radio className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin — Ao Vivo</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie as transmissões ao vivo da Copa do Mundo 2026
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          {/* ── Sync trigger ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sincronizar resultados</CardTitle>
              <CardDescription>
                Dispara o job manualmente — vincula streams pendentes a jogos LIVE e salva
                resultados finalizados.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button variant="outline" className="w-fit" onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                {isSyncing ? "Sincronizando..." : "Disparar sync agora"}
              </Button>

              {syncResult && (
                <div className="flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/5 p-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  <div className="space-y-1">
                    <p className="font-medium text-green-700 dark:text-green-400">Sync concluído</p>
                    <p className="text-muted-foreground">
                      {syncResult.syncedResults} resultado(s) salvos · {syncResult.linkedStreams}{" "}
                      stream(s) vinculado(s)
                    </p>
                    {syncResult.live?.length > 0 && (
                      <p className="text-muted-foreground">
                        Ao vivo agora: {syncResult.live.join(" | ")}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {syncError && (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm">
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <p className="text-destructive">{syncError}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Create form ───────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Adicionar transmissão</CardTitle>
              <CardDescription>
                Insira com antecedência — o cron vincula ao jogo automaticamente quando ficar LIVE.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
                {/* YouTube Video ID */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="youtube_video_id">
                    YouTube Video ID{" "}
                    <span className="text-muted-foreground font-normal">(11 caracteres)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="youtube_video_id"
                      placeholder="dQw4w9WgXcQ"
                      {...register("youtube_video_id")}
                      className={cn(errors.youtube_video_id && "border-destructive")}
                    />
                    {watch("youtube_video_id")?.length === 11 && (
                      <a
                        href={`https://www.youtube.com/watch?v=${watch("youtube_video_id")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center"
                      >
                        <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </a>
                    )}
                  </div>
                  {errors.youtube_video_id && (
                    <p className="text-xs text-destructive">{errors.youtube_video_id.message}</p>
                  )}
                </div>

                {/* Label */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="label">Canal</Label>
                  <Input
                    id="label"
                    placeholder="CazéTV"
                    {...register("label")}
                    className={cn(errors.label && "border-destructive")}
                  />
                  {errors.label && (
                    <p className="text-xs text-destructive">{errors.label.message}</p>
                  )}
                </div>

                {/* Team hint */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="team_hint">
                    Time (team_hint){" "}
                    <span className="text-muted-foreground font-normal">
                      — deixe vazio se usar match_id
                    </span>
                  </Label>
                  <Select
                    value={teamHintValue ?? ""}
                    onValueChange={(v) => setValue("team_hint", v === "_none" ? "" : v)}
                  >
                    <SelectTrigger id="team_hint">
                      <SelectValue placeholder="Selecionar time..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">— Nenhum —</SelectItem>
                      {ESPN_TEAMS.map((t) => (
                        <SelectItem key={t.abbr} value={t.abbr}>
                          {t.abbr} · {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Match ID (optional) */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="match_id">
                    Match ID (ESPN){" "}
                    <span className="text-muted-foreground font-normal">— opcional</span>
                  </Label>
                  <Input
                    id="match_id"
                    placeholder="760493"
                    {...register("match_id")}
                    className={cn(errors.match_id && "border-destructive")}
                  />
                  {errors.match_id && (
                    <p className="text-xs text-destructive">{errors.match_id.message}</p>
                  )}
                </div>

                {/* Submit */}
                <div className="sm:col-span-2">
                  {createMutation.data && !createMutation.data.success && (
                    <p className="mb-2 text-sm text-destructive">{createMutation.data.error}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting || createMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {createMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Adicionar stream
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ── Active streams ────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Streams ativos</CardTitle>
                <Badge variant="secondary">{activeStreams.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : activeStreams.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Nenhum stream ativo no momento.
                </p>
              ) : (
                <div className="divide-y divide-border">
                  {activeStreams.map((stream) => (
                    <StreamRow
                      key={stream.id}
                      stream={stream}
                      onToggle={(id) => toggleMutation.mutate({ id, isActive: false })}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      isToggling={toggleMutation.isPending}
                      isDeleting={deleteMutation.isPending}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Inactive streams ──────────────────────────────────────────── */}
          {inactiveStreams.length > 0 && (
            <Card className="opacity-60">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base text-muted-foreground">
                    Streams inativos
                  </CardTitle>
                  <Badge variant="outline">{inactiveStreams.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border">
                  {inactiveStreams.map((stream) => (
                    <StreamRow
                      key={stream.id}
                      stream={stream}
                      onToggle={(id) => toggleMutation.mutate({ id, isActive: true })}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      isToggling={toggleMutation.isPending}
                      isDeleting={deleteMutation.isPending}
                      inactive
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── StreamRow sub-component ──────────────────────────────────────────────────

interface StreamRowProps {
  stream: LiveStreamRow;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  isToggling: boolean;
  isDeleting: boolean;
  inactive?: boolean;
}

function StreamRow({
  stream,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
  inactive,
}: StreamRowProps) {
  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Info */}
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{stream.label}</span>
          {stream.match_id ? (
            <Badge variant="secondary" className="text-xs">
              match #{stream.match_id}
            </Badge>
          ) : stream.team_hint ? (
            <Badge
              variant="outline"
              className="text-xs text-amber-600 border-amber-500/30 bg-amber-500/5"
            >
              hint: {stream.team_hint} · aguardando LIVE
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              sem vínculo
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <a
            href={`https://www.youtube.com/watch?v=${stream.youtube_video_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground flex items-center gap-1 underline-offset-2 hover:underline"
          >
            {stream.youtube_video_id}
            <ExternalLink className="h-3 w-3" />
          </a>
          <span>·</span>
          <span>{dayjs(stream.created_at).fromNow()}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => onToggle(stream.id)}
          disabled={isToggling}
        >
          {inactive ? (
            <>
              <ToggleLeft className="h-3.5 w-3.5" />
              Ativar
            </>
          ) : (
            <>
              <ToggleRight className="h-3.5 w-3.5 text-green-500" />
              Desativar
            </>
          )}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar stream?</AlertDialogTitle>
              <AlertDialogDescription>
                O stream <strong>{stream.youtube_video_id}</strong> ({stream.label}) será removido
                permanentemente. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(stream.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
