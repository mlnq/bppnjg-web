import { fmt } from "../lib/format";
import { Eyebrow } from "./Eyebrow";

type DailyDistanceHeroProps = {
  distance: number;
  marginTop?: React.CSSProperties["marginTop"];
};

export function DailyDistanceHero({
  distance,
  marginTop = "var(--s3)",
}: DailyDistanceHeroProps) {
  return (
    <>
      <div className="dial__num" style={{ marginTop }}>
        {fmt(distance)}
        <small>km</small>
      </div>
      <Eyebrow wine style={{ marginTop: 2 }}>
        Łącznie dzisiaj do pokonania
      </Eyebrow>
    </>
  );
}
