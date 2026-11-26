import { initials } from "@/lib/format";
import { useSignedImage } from "@/lib/storage";
import { cn } from "@/lib/utils";

export function UserAvatar({ name, path, className }: { name?: string | null | undefined; path?: string | null | undefined; className?: string | undefined }) {
  const { data: url } = useSignedImage(path);
  return (
    <span
      className={cn(
        "relative inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3 text-xs font-bold text-foreground",
        className,
      )}
    >
      {url ? <img src={url} alt={name ?? "Avatar"} className="size-full object-cover" /> : initials(name)}
    </span>
  );
}
