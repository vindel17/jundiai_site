import { SUPABASE_URL } from "@/lib/supabase/config";

export function urlFotoAnuncio(fotoPath: string | null | undefined) {
  if (!fotoPath) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/anuncios/${fotoPath}`;
}

export function linkWhatsApp(telefone: string) {
  const digitos = telefone.replace(/\D/g, "");
  if (!digitos) return "#";
  return `https://wa.me/${digitos}`;
}
