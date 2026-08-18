import { NextResponse } from "next/server";

type ViaCepResponse = {
  erro?: boolean;
  cep?: string;
  logradouro?: string;
  complemento?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ cep: string }> },
) {
  const { cep: raw } = await context.params;
  const cep = raw.replace(/\D/g, "");

  if (cep.length !== 8) {
    return NextResponse.json({ error: "CEP inválido" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Falha ao consultar CEP" }, { status: 502 });
    }

    const data = (await res.json()) as ViaCepResponse;
    if (data.erro) {
      return NextResponse.json({ error: "CEP não encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      cep: data.cep?.replace(/\D/g, "") ?? cep,
      rua: data.logradouro ?? "",
      bairro: data.bairro ?? "",
      cidade: data.localidade ?? "",
      uf: data.uf ?? "",
    });
  } catch {
    return NextResponse.json({ error: "Falha ao consultar CEP" }, { status: 502 });
  }
}
