import { afterEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import { equipeConfigurada, perfisDoUsuario, pode, rotuloPerfis } from "./equipe";

const VARIAVEIS = [
  "EQUIPE_ADMIN",
  "EQUIPE_PRODUCAO",
  "EQUIPE_BALCAO",
  "EQUIPE_TELEFONES",
  "EQUIPE_EMAILS",
];

function usuario(parcial: { phone?: string; email?: string }) {
  return parcial as User;
}

afterEach(() => {
  for (const nome of VARIAVEIS) vi.stubEnv(nome, "");
  vi.unstubAllEnvs();
});

describe("perfis da equipe", () => {
  it("sem lista, a equipe não está configurada", () => {
    expect(equipeConfigurada()).toBe(false);
    expect(perfisDoUsuario(usuario({ phone: "5511999990000" }))).toEqual([]);
  });

  it("EQUIPE_TELEFONES e EQUIPE_EMAILS continuam como administração", () => {
    vi.stubEnv("EQUIPE_TELEFONES", "55 (11) 99999-0000");
    vi.stubEnv("EQUIPE_EMAILS", "Ana@Loja.com");
    expect(perfisDoUsuario(usuario({ phone: "+5511999990000" }))).toEqual(["admin"]);
    expect(perfisDoUsuario(usuario({ email: "ana@loja.com" }))).toEqual(["admin"]);
    expect(pode(["admin"], "cancelar")).toBe(true);
  });

  it("produção muda status e não edita tamanho nem cancela", () => {
    vi.stubEnv("EQUIPE_PRODUCAO", "producao@loja.com, 5511988880000");
    expect(perfisDoUsuario(usuario({ email: "producao@loja.com" }))).toEqual(["producao"]);
    expect(pode(["producao"], "ver")).toBe(true);
    expect(pode(["producao"], "status")).toBe(true);
    expect(pode(["producao"], "producao")).toBe(true);
    expect(pode(["producao"], "avisos")).toBe(true);
    expect(pode(["producao"], "editar")).toBe(false);
    expect(pode(["producao"], "cancelar")).toBe(false);
  });

  it("balcão consulta e edita tamanho", () => {
    vi.stubEnv("EQUIPE_BALCAO", "5511977770000");
    expect(perfisDoUsuario(usuario({ phone: "5511977770000" }))).toEqual(["balcao"]);
    expect(pode(["balcao"], "editar")).toBe(true);
    expect(pode(["balcao"], "status")).toBe(false);
  });

  it("quem está em duas listas soma as permissões", () => {
    vi.stubEnv("EQUIPE_PRODUCAO", "5511966660000");
    vi.stubEnv("EQUIPE_BALCAO", "5511966660000");
    const perfis = perfisDoUsuario(usuario({ phone: "5511966660000" }));
    expect(perfis).toEqual(["producao", "balcao"]);
    expect(pode(perfis, "status")).toBe(true);
    expect(pode(perfis, "editar")).toBe(true);
    expect(pode(perfis, "cancelar")).toBe(false);
    expect(rotuloPerfis(perfis)).toBe("produção e balcão");
  });

  it("telefone de fora não entra", () => {
    vi.stubEnv("EQUIPE_ADMIN", "5511955550000");
    expect(equipeConfigurada()).toBe(true);
    expect(perfisDoUsuario(usuario({ phone: "5511900000000", email: "outro@loja.com" }))).toEqual(
      [],
    );
  });
});
