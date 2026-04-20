import type { Match } from "../../types";

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  return (
    <article className="rounded-2xl border border-white/15 bg-white/5 p-4">
      <h3 className="text-white font-headline font-bold">{match.name}</h3>
      <p className="text-white/70 text-sm">{match.role}</p>
    </article>
  );
}
