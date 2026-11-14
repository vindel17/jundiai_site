import { afterEach, describe, expect, it, vi } from "vitest";
import { destinosDoAviso, textoDoAviso } from "./fila-aviso";

const VARIAVEIS = ["EQUIPE_ADMIN", "EQUIPE_TELEFONES", "EQUIPE_EMAILS", "EQUIPE_PRODUCAO", "EQUIPE_BALCAO"];

afterEach(() => {
  for (const nome of VARIAVEIS) vi.stubEnv(nome, "");
  vi.unstubAllEnvs();
});

describe("aviso de fila nova", () => {
  it("avisa os telefones da administração, uma vez, e deixa e-mail e produção de fora", () => {
    vi.stubEnv("EQUIPE_ADMIN", "5511911112222, dono@loja.com");
    vi.stubEnv("EQUIPE_TELEFONES", "(11) 91111-2222");
    vi.stubEnv("EQUIPE_PRODUCAO", "5511933334444");

    expect(destinosDoAviso("5511900000000")).toEqual(["5511911112222"]);
    expect(destinosDoAviso("5511911112222")).toEqual([]);
  });

  it("manda o trecho da pergunta e o link da conversa", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    expect(textoDoAviso(id, "  A loja\nabre domingo?  ")).toBe(
      [
        "Nova conversa na fila do WhatsApp.",
        '"A loja abre domingo?"',
        `Abrir: https://uniformejundiai.com.br/equipe/atendimento?conversa=${id}`,
      ].join("\n\n"),
    );
    expect(textoDoAviso(null, "   ")).toBe(
      "Nova conversa na fila do WhatsApp.\n\nAbrir: https://uniformejundiai.com.br/equipe/atendimento",
    );
  });
});
