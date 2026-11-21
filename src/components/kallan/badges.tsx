import { Building2, FlaskConical, PencilLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DemoBadge({ className }: { className?: string }) {
  return (
    <Badge variant="warning" className={className}>
      <FlaskConical /> Dados de demonstração
    </Badge>
  );
}

export function SourceBadge({
  source,
  institution,
  className,
}: {
  source: "manual" | "open_finance";
  institution?: string | null;
  className?: string;
}) {
  if (source === "open_finance") {
    return (
      <Badge variant="info" className={className}>
        <Building2 /> {institution ? institution : "Instituição conectada"}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className={className}>
      <PencilLine /> Registro manual
    </Badge>
  );
}
