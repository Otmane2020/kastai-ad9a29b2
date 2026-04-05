import { LayoutDashboard, TrendingUp, Target, AlertTriangle, ArrowUpRight, ArrowDownRight } from "lucide-react";
import KPICard from "@/components/KPICard";
import PageHeader from "@/components/PageHeader";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const revenueData = [
  { month: "Jan", réel: 420, prévu: 400 }, { month: "Fév", réel: 450, prévu: 430 },
  { month: "Mar", réel: 480, prévu: 460 }, { month: "Avr", réel: 510, prévu: 490 },
  { month: "Mai", réel: 530, prévu: 520 }, { month: "Jun", réel: 560, prévu: 550 },
  { month: "Jul", réel: 590, prévu: 570 }, { month: "Aoû", réel: 610, prévu: 600 },
];

const modelPerf = [
  { model: "Prophet", mape: 4.2 }, { model: "ARIMA", mape: 5.8 },
  { model: "XGBoost", mape: 3.9 }, { model: "LSTM", mape: 4.5 },
];

const categoryData = [
  { name: "Électronique", value: 35 }, { name: "Textile", value: 25 },
  { name: "Alimentaire", value: 22 }, { name: "Autres", value: 18 },
];
const COLORS = ["hsl(217, 91%, 50%)", "hsl(199, 89%, 48%)", "hsl(152, 69%, 40%)", "hsl(38, 92%, 50%)"];

export default function Dashboard() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Dashboard"
        description="Vue globale des performances et KPIs"
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <KPICard title="Chiffre d'affaires" value="€2.4M" change="+12.5% vs mois dernier" changeType="up" icon={<TrendingUp className="h-5 w-5" />} />
        <KPICard title="Précision prévisions" value="95.8%" change="+2.1% vs trimestre" changeType="up" icon={<Target className="h-5 w-5" />} />
        <KPICard title="Alertes actives" value="7" change="3 critiques" changeType="down" icon={<AlertTriangle className="h-5 w-5" />} />
        <KPICard title="Croissance" value="+8.3%" change="Tendance haussière" changeType="up" icon={<ArrowUpRight className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Réel vs Prévu (€k)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="realGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(217, 91%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid hsl(214, 20%, 90%)", fontSize: 12 }} />
              <Area type="monotone" dataKey="réel" stroke="hsl(217, 91%, 50%)" fill="url(#realGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="prévu" stroke="hsl(199, 89%, 48%)" fill="none" strokeWidth={2} strokeDasharray="5 5" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Répartition ventes</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {categoryData.map((c, i) => (
              <div key={c.name} className="flex items-center gap-2 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-muted-foreground">{c.name}</span>
                <span className="ml-auto font-medium text-card-foreground">{c.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card">
        <h3 className="font-display text-sm font-semibold text-card-foreground mb-4">Performance des modèles (MAPE %)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={modelPerf}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
            <XAxis dataKey="model" tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(215, 15%, 50%)" />
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="mape" radius={[8, 8, 0, 0]}>
              {modelPerf.map((entry, i) => (
                <Cell key={i} fill={entry.mape === Math.min(...modelPerf.map(m => m.mape)) ? "hsl(152, 69%, 40%)" : "hsl(217, 91%, 50%)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
