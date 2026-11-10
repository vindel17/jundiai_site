import { GABARITOS, gerarArquivo } from "@/lib/gabarito/arquivos";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(GABARITOS).map((arquivo) => ({ arquivo }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ arquivo: string }> },
) {
  const { arquivo } = await params;
  const bytes = gerarArquivo(arquivo);
  if (!bytes) return new Response("Não encontrado", { status: 404 });

  return new Response(bytes, {
    headers: {
      "Content-Type": "model/gltf-binary",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
