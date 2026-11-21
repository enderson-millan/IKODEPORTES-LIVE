/* eslint-disable prettier/prettier */
"use client";

import { useState, useEffect } from "react";
import { X, Goal, Lock } from "lucide-react";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Match, Pick } from "@/lib/types";
import { useApp } from "@/lib/app-context";
import { cn } from "@/lib/utils";

// ─── Score input for a single team ───────────────────────────────────────────

interface ScoreInputProps {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}

function ScoreInput({ value, onChange, disabled }: ScoreInputProps) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      max={99}
      value={value}
      onChange={(e) => {
        const raw = e.target.value.replace(/\D/g, "");
        if (raw === "" || (Number(raw) >= 0 && Number(raw) <= 99)) {
          onChange(raw);
        }
      }}
      disabled={disabled}
      className="h-11 w-16 text-center text-xl font-bold tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      aria-label="Gols"
    />
  );
}

// ─── Team pick button ─────────────────────────────────────────────────────────

interface TeamPickButtonProps {
  team: Match["teamA"];
  isSelected: boolean;
  locked: boolean;
  onSelect: () => void;
}

function TeamPickButton({ team, isSelected, locked, onSelect }: TeamPickButtonProps) {
  const isTbd = team.abbr === "TBD";

  return (
    <button
      type="button"
      disabled={locked || isTbd}
      onClick={onSelect}
      className={cn(
        "flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
        isSelected
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/50 hover:bg-primary/5",
        (locked || isTbd) && "cursor-default opacity-60",
      )}
    >
      <div className="h-10 w-10 overflow-hidden rounded-full ring-1 ring-border">
        {!isTbd && team.logo ? (
          <Image
            src={team.logo}
            alt={team.abbr}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>
      <span className="text-xs font-bold tracking-wide">{isTbd ? "?" : team.abbr}</span>
      {isSelected && (
        <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
          ✓
        </span>
      )}
    </button>
  );
}

// ─── BracketPickerDrawer ──────────────────────────────────────────────────────

interface BracketPickerDrawerProps {
  match: Match | null;
  picked?: Pick;
  onPick: (teamId: string, scoreA?: number, scoreB?: number) => void;
  onClose: () => void;
}

/**
 * Bottom drawer that opens when a user taps a bracket card on mobile.
 * Allows picking the winner AND optionally predicting the score.
 */
export function BracketPickerDrawer({ match, picked, onPick, onClose }: BracketPickerDrawerProps) {
  const { t } = useApp();

  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [scoreA, setScoreA] = useState<string>("");
  const [scoreB, setScoreB] = useState<string>("");

  // Sync state when match/picked changes
  useEffect(() => {
    if (match) {
      setSelectedTeamId(picked?.teamId ?? null);
      setScoreA(picked?.scoreA != null ? String(picked.scoreA) : "");
      setScoreB(picked?.scoreB != null ? String(picked.scoreB) : "");
    }
  }, [match, picked]);

  if (!match) return null;

  const locked = match.status !== "UPCOMING";
  const hasScore = scoreA !== "" && scoreB !== "";

  const handleConfirm = () => {
    if (!selectedTeamId) return;
    const a = scoreA !== "" ? Number(scoreA) : undefined;
    const b = scoreB !== "" ? Number(scoreB) : undefined;
    onPick(selectedTeamId, a, b);
    onClose();
  };

  // Points preview
  const pointsPreview = (() => {
    if (!selectedTeamId) return null;
    if (hasScore) return "até 30 pts";
    return "10 pts";
  })();

  return (
    <Drawer
      open={match !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent className="px-4 pb-8">
        <DrawerHeader className="relative pr-10">
          <DrawerTitle className="text-base font-bold">
            {`${match.teamA.name} × ${match.teamB.name}`}
          </DrawerTitle>

          <DrawerClose
            onClick={onClose}
            className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </DrawerClose>
        </DrawerHeader>

        <div className="mt-2 flex flex-col gap-4">
          {/* ── Lock alert ── */}
          {locked && (
            <Alert
              variant="default"
              className={cn(
                "border",
                match.status === "LIVE"
                  ? "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400"
                  : "border-border bg-muted/50 text-muted-foreground",
              )}
            >
              <Lock className="h-4 w-4 shrink-0" />
              <AlertDescription className="text-xs font-medium">
                {match.status === "LIVE"
                  ? "Jogo em andamento — palpites encerrados."
                  : "Jogo encerrado — palpites não podem ser alterados."}
              </AlertDescription>
            </Alert>
          )}

          {/* ── Team selection ── */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("pickHint")}
            </p>
            <div className="flex gap-3">
              <TeamPickButton
                team={match.teamA}
                isSelected={selectedTeamId === match.teamA.id}
                locked={locked}
                onSelect={() => setSelectedTeamId(match.teamA.id)}
              />
              <div className="flex items-center">
                <span className="text-sm font-bold text-muted-foreground">×</span>
              </div>
              <TeamPickButton
                team={match.teamB}
                isSelected={selectedTeamId === match.teamB.id}
                locked={locked}
                onSelect={() => setSelectedTeamId(match.teamB.id)}
              />
            </div>
          </div>

          {/* ── Score prediction ── */}
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Goal className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Placar (opcional · bônus de pontos)
              </p>
            </div>

            <div className="flex items-center justify-center gap-3">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {match.teamA.abbr === "TBD" ? "?" : match.teamA.abbr}
                </span>
                <ScoreInput
                  value={scoreA}
                  onChange={setScoreA}
                  disabled={locked || !selectedTeamId}
                />
              </div>

              <span className="mt-4 text-xl font-bold text-muted-foreground">–</span>

              <div className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {match.teamB.abbr === "TBD" ? "?" : match.teamB.abbr}
                </span>
                <ScoreInput
                  value={scoreB}
                  onChange={setScoreB}
                  disabled={locked || !selectedTeamId}
                />
              </div>
            </div>

            {/* Points breakdown hint */}
            <div className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-center text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">10 pts</span> vencedor ·{" "}
              <span className="font-semibold text-foreground">+5 pts</span> diferença ·{" "}
              <span className="font-semibold text-foreground">+15 pts</span> placar exato
            </div>
          </div>

          {/* ── Confirm button ── */}
          {!locked && (
            <Button onClick={handleConfirm} disabled={!selectedTeamId} className="w-full">
              {selectedTeamId
                ? `Confirmar palpite${pointsPreview ? ` · ${pointsPreview}` : ""}`
                : "Escolha um time"}
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
