import { BarChart3, CreditCard, ScanFace, Users } from "lucide-react";

const metrics = [
  {
    label: "\u7528\u6237\u6570\u91cf",
    value: "12,486",
    icon: Users,
  },
  {
    label: "\u4ed8\u8d39\u4eba\u6570",
    value: "1,928",
    icon: CreditCard,
  },
  {
    label: "\u5206\u6790\u6b21\u6570",
    value: "36,741",
    icon: ScanFace,
  },
];

export default function DashboardPage() {
  return (
    <main className="admin-page">
      <section className="admin-header">
        <p>Dashboard</p>
        <h1>{"\u6570\u636e\u770b\u677f"}</h1>
      </section>

      <section className="admin-metric-grid">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <article className="admin-metric-card" key={metric.label}>
              <Icon aria-hidden />
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="admin-panel-card">
        <BarChart3 aria-hidden />
        <div>
          <h2>{"\u6838\u5fc3\u8f6c\u5316\u6570\u636e"}</h2>
          <p>{"\u7528\u4e8e\u8ffd\u8e2a\u7528\u6237\u4e0a\u4f20\u3001AI\u5206\u6790\u3001\u535a\u4e3b\u5339\u914d\u548c\u4f1a\u5458\u4ed8\u8d39\u7684\u5168\u94fe\u8def\u8f6c\u5316\u3002"}</p>
        </div>
      </section>
    </main>
  );
}
