import type { TrendResult } from "../../services/indicatorService";
import { Icon } from "../ui/Icon";

const ICON_BY_DIRECTION = { up: "arrow-up", down: "arrow-down", flat: "minus" } as const;

interface TrendBadgeProps {
  trend: TrendResult;
  /** Append "dibanding <periode>" after the badge. */
  showComparison?: boolean;
}

/** Change pill coloured by whether the move is good for the region, not by its sign. */
export function TrendBadge({ trend, showComparison = true }: TrendBadgeProps) {
  return (
    <span className="trend" aria-label={trend.label}>
      <span className={`trend-badge is-${trend.sentiment}`} aria-hidden="true">
        <Icon name={ICON_BY_DIRECTION[trend.direction]} size={12} />
        {trend.direction === "flat" ? "Tetap" : trend.magnitude}
      </span>
      {showComparison ? (
        <span className="trend-compare" aria-hidden="true">
          {trend.comparedLine}
        </span>
      ) : null}
    </span>
  );
}
