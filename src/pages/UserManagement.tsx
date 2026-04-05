import { UserCog, ShieldCheck, MailPlus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

const users = [
  { name: "Karim B.", email: "karim@kastai.com", role: "Admin", status: "Actif", lastLogin: "Aujourd'hui" },
  { name: "Sarah M.", email: "sarah@kastai.com", role: "Analyste", status: "Actif", lastLogin: "Hier" },
  { name: "Thomas L.", email: "thomas@kastai.com", role: "Viewer", status: "Actif", lastLogin: "Il y a 3 jours" },
  { name: "Julie P.", email: "julie@kastai.com", role: "Analyste", status: "Invité", lastLogin: "—" },
];

export default function UserManagement() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Utilisateurs"
        description="Gestion des utilisateurs, rôles et permissions"
        icon={<Users className="h-5 w-5" />}
        actions={
          <button className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
            <Mail className="h-4 w-4" />Inviter
          </button>
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Utilisateur</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Rôle</th>
              <th className="px-5 py-3 text-center text-xs font-medium text-muted-foreground">Statut</th>
              <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Dernière connexion</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.email} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                <td className="px-5 py-3">
                  <p className="font-medium text-card-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-card-foreground">{u.role}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-center">
                  <span className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    u.status === "Actif" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                  )}>
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{u.lastLogin}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
