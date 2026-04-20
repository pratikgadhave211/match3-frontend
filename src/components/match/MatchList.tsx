import type { Match } from "../../types";
import MatchCard from "./MatchCard";

interface MatchListProps {
  matches: Match[];
}

export default function MatchList({ matches }: MatchListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {matches.map((match) => (
        <MatchCard key={match.name} match={match} />
      ))}
    </div>
  );
}
