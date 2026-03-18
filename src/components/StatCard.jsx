import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendUp,
  color = "green",
}) {
  const colorStyles = {
    green: "var(--green)",
    blue: "#64b5f6",
    purple: "#ba68c8",
    orange: "#ffb74d",
    red: "#ef5350",
  };

  const accentColor = colorStyles[color] || colorStyles.green;

  return (
    <div
      className="rounded-lg p-6 transition-all hover:translate-y-[-4px]"
      style={{
        background: "var(--light-navy)",
        border: "1px solid var(--lightest-navy)",
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p style={{ color: "var(--slate)" }} className="text-sm font-medium mb-1">
            {title}
          </p>
          <h3
            className="text-3xl font-bold"
            style={{ color: "var(--lightest-slate)" }}
          >
            {value}
          </h3>
          {subtitle && (
            <p style={{ color: "var(--slate)" }} className="text-sm mt-1">
              {subtitle}
            </p>
          )}
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trendUp ? (
                <TrendingUp className="h-4 w-4" style={{ color: "var(--green)" }} />
              ) : (
                <TrendingDown className="h-4 w-4" style={{ color: "#ef5350" }} />
              )}
              <span
                className="text-sm"
                style={{ color: trendUp ? "var(--green)" : "#ef5350" }}
              >
                {trend}%
              </span>
              <span style={{ color: "var(--slate)" }} className="text-sm">
                vs last month
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="h-12 w-12 rounded-lg flex items-center justify-center"
            style={{ background: `${accentColor}20` }}
          >
            <Icon className="h-6 w-6" style={{ color: accentColor }} />
          </div>
        )}
      </div>
    </div>
  );
}
