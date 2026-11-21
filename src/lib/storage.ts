import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BUCKET = "media";
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Uploads an image into the user's own folder of the private media bucket. Returns the storage path. */
export async function uploadImage(userId: string, file: File, folder: string): Promise<string> {
  if (!ALLOWED.includes(file.type)) throw new Error("Envie uma imagem JPG, PNG, WEBP ou GIF.");
  if (file.size > MAX_BYTES) throw new Error("A imagem deve ter no máximo 8 MB.");
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new Error("Não foi possível enviar a imagem.");
  return path;
}

/** Resolves a stored path (private bucket) into a short-lived signed URL. */
export function useSignedImage(path: string | null | undefined) {
  return useQuery({
    queryKey: ["signed-image", path],
    enabled: !!path,
    staleTime: 50 * 60 * 1000,
    queryFn: async () => {
      if (!path) return null;
      if (path.startsWith("http")) return path;
      const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);
      if (error) return null;
      return data.signedUrl;
    },
  });
}
