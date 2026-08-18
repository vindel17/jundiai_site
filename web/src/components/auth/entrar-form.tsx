"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { formatarCelular, paraE164 } from "@/lib/telefone";
import { vincularIndicacaoDoCookie } from "@/app/conta/indicacao-acoes";

type Etapa = "telefone" | "codigo";

export function EntrarForm({ proximo }: { proximo: string }) {
  const router = useRouter();
  const [etapa, setEtapa] = useState<Etapa>("telefone");
  const [celular, setCelular] = useState("");
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const e164 = paraE164(celular);

  async function pedirCodigo(e: React.FormEvent) {
    e.preventDefault();
    if (!e164) {
      setErro("Digite o celular com DDD, incluindo o 9.");
      return;
    }

    setErro("");
    setEnviando(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 });
    setEnviando(false);

    if (error) {
      setErro(error.message);
      return;
    }
    setEtapa("codigo");
  }

  async function conferirCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.verifyOtp({
      phone: e164!,
      token: codigo.trim(),
      type: "sms",
    });
    setEnviando(false);

    if (error) {
      setErro("Código incorreto ou expirado. Peça um novo.");
      return;
    }

    await vincularIndicacaoDoCookie();
    router.push(proximo);
    router.refresh();
  }

  if (etapa === "codigo") {
    return (
      <form className="entrar-form" onSubmit={conferirCodigo}>
        <p className="entrar-sent">
          Enviamos um código no WhatsApp do <b>{formatarCelular(celular)}</b>.
        </p>

        <div className="uj-field">
          <label htmlFor="codigo">Código de 6 dígitos</label>
          <input
            id="codigo"
            className="entrar-code"
            value={codigo}
            onChange={(ev) => setCodigo(ev.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            required
            autoFocus
          />
        </div>

        {erro && <p className="entrar-erro">{erro}</p>}

        <button
          type="submit"
          className="btn-primary"
          disabled={enviando || codigo.length < 6}
        >
          {enviando ? "Conferindo..." : "Entrar"}
        </button>

        <button
          type="button"
          className="entrar-voltar"
          onClick={() => {
            setEtapa("telefone");
            setCodigo("");
            setErro("");
          }}
        >
          Trocar o número
        </button>
      </form>
    );
  }

  return (
    <form className="entrar-form" onSubmit={pedirCodigo}>
      <div className="uj-field">
        <label htmlFor="celular">Seu WhatsApp</label>
        <input
          id="celular"
          value={celular}
          onChange={(ev) => setCelular(formatarCelular(ev.target.value))}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="(11) 99999-9999"
          required
          autoFocus
        />
      </div>

      {erro && <p className="entrar-erro">{erro}</p>}

      <button type="submit" className="btn-primary" disabled={enviando || !e164}>
        {enviando ? "Enviando..." : "Receber código no WhatsApp"}
      </button>

      <p className="entrar-nota">
        Usamos o celular só para confirmar que você é uma pessoa real. Uma conta por
        número — é assim que a doação alcança mais famílias.
      </p>
    </form>
  );
}
