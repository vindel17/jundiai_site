"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ESCOLAS_JUNDIAI } from "@/data/escolas";
import { SITE } from "@/lib/constants";
import { loadTracking, trackEvent } from "@/lib/utm";

type FilhoState = {
  nomeOuIniciais: string;
  escola: string;
  turma: string;
};

const emptyFilho = (): FilhoState => ({
  nomeOuIniciais: "",
  escola: "",
  turma: "",
});

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskWhatsApp(value: string) {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCep(value: string) {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function SolicitacaoForm() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [filhos, setFilhos] = useState<FilhoState[]>([emptyFilho()]);
  const [isResponsavel, setIsResponsavel] = useState(false);
  const [redeMunicipal, setRedeMunicipal] = useState(false);
  const [responsavelNome, setResponsavelNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [consentimento, setConsentimento] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [cepStatus, setCepStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const totalEtiquetas = useMemo(
    () => filhos.length * SITE.etiquetasPorFilho,
    [filhos.length],
  );

  useEffect(() => {
    trackEvent("start_form");
  }, []);

  function updateFilho(index: number, patch: Partial<FilhoState>) {
    setFilhos((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f)),
    );
  }

  function addFilho() {
    if (filhos.length >= SITE.maxFilhos) return;
    setFilhos((prev) => [...prev, emptyFilho()]);
  }

  function removeFilho(index: number) {
    if (filhos.length === 1) return;
    setFilhos((prev) => prev.filter((_, i) => i !== index));
  }

  async function lookupCep(raw: string) {
    const digits = onlyDigits(raw);
    if (digits.length !== 8) return;
    setCepStatus("Buscando endereço...");
    try {
      const res = await fetch(`/api/cep/${digits}`);
      const data = await res.json();
      if (!res.ok) {
        setCepStatus(data.error ?? "CEP não encontrado");
        return;
      }
      if (data.cidade && data.cidade !== "Jundiaí") {
        setCepStatus(
          "O envio é para Jundiaí-SP. Confira o CEP ou fale no WhatsApp.",
        );
      } else {
        setCepStatus(null);
      }
      setRua(data.rua ?? "");
      setBairro(data.bairro ?? "");
    } catch {
      setCepStatus("Não foi possível consultar o CEP.");
    }
  }

  function validateStep1() {
    if (!isResponsavel || !redeMunicipal) {
      return "Confirme que você é responsável e que o(s) aluno(s) estuda(m) na rede municipal.";
    }
    for (const [i, filho] of filhos.entries()) {
      if (filho.nomeOuIniciais.trim().length < 2) {
        return `Informe o nome ou iniciais do filho ${i + 1}.`;
      }
      if (!filho.escola) {
        return `Selecione a escola do filho ${i + 1}.`;
      }
    }
    return null;
  }

  /** Sem isso o novo passo aparece no meio da tela, como se nada tivesse mudado. */
  function irParaTopoDoFormulario() {
    document.getElementById("formulario")?.scrollIntoView();
  }

  function goStep2() {
    const err = validateStep1();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep(2);
    irParaTopoDoFormulario();
    trackEvent("form_step_2");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!consentimento) {
      setError("Aceite a política de privacidade para continuar.");
      return;
    }
    if (responsavelNome.trim().length < 3) {
      setError("Informe o nome completo do responsável.");
      return;
    }
    if (onlyDigits(whatsapp).length < 10) {
      setError("Informe um WhatsApp válido.");
      return;
    }
    if (onlyDigits(cep).length !== 8 || !rua || !numero || !bairro) {
      setError("Preencha o endereço completo para envio pelos Correios.");
      return;
    }

    const tracking = loadTracking();
    setSubmitting(true);
    try {
      const res = await fetch("/api/solicitacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responsavelNome: responsavelNome.trim(),
          whatsapp: onlyDigits(whatsapp),
          email: email.trim(),
          cep: onlyDigits(cep),
          rua: rua.trim(),
          numero: numero.trim(),
          complemento: complemento.trim(),
          bairro: bairro.trim(),
          cidade: "Jundiaí",
          uf: "SP",
          consentimento: true,
          filhos: filhos.map((f) => ({
            nomeOuIniciais: f.nomeOuIniciais.trim(),
            escola: f.escola,
            turma: f.turma.trim(),
          })),
          origem: tracking.origem,
          utmSource: tracking.utmSource,
          utmMedium: tracking.utmMedium,
          utmCampaign: tracking.utmCampaign,
          honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Não foi possível enviar. Tente novamente.");
        return;
      }

      trackEvent("submit_form", {
        filhos: data.filhos,
        etiquetas: data.totalEtiquetas,
      });

      const qs = new URLSearchParams({
        filhos: String(data.filhos),
        etiquetas: String(data.totalEtiquetas),
      });
      router.push(`/etiquetas/confirmacao?${qs.toString()}`);
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="formulario" className="section-block form-section">
      <div className="form-shell mx-auto max-w-2xl">
        <div className="text-center">
          <span className="gift-badge">🏷️ Falta pouco para o seu kit</span>
          <h2 className="section-title">Vamos personalizar?</h2>
          <p className="section-lead mx-auto">
            Conte para a gente o nome que vai nas etiquetas. Leva poucos minutos.
          </p>
        </div>

        <div className="form-steps">
          <span className={step === 1 ? "step-pill step-pill-active" : "step-pill"}>
            1. Personalização
          </span>
          <span className={step === 2 ? "step-pill step-pill-active" : "step-pill"}>
            2. Onde entregar
          </span>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6" noValidate>
          <input
            type="text"
            name="company"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden
          />

          {step === 1 && (
            <div className="space-y-6">
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={isResponsavel}
                  onChange={(e) => setIsResponsavel(e.target.checked)}
                />
                <span>Sim, sou responsável pelo(s) aluno(s).</span>
              </label>
              <label className="check-row">
                <input
                  type="checkbox"
                  checked={redeMunicipal}
                  onChange={(e) => setRedeMunicipal(e.target.checked)}
                />
                <span>
                  Sim, ele(s) estuda(m) na rede municipal de {SITE.city}.
                </span>
              </label>

              {filhos.map((filho, index) => (
                <fieldset key={index} className="child-card">
                  <legend className="child-card-legend">
                    Etiquetas do {index + 1}º filho
                    {filhos.length > 1 && (
                      <button
                        type="button"
                        className="text-sm font-medium text-[var(--accent)] underline-offset-2 hover:underline"
                        onClick={() => removeFilho(index)}
                      >
                        Remover
                      </button>
                    )}
                  </legend>
                  <div className="grid gap-4">
                    <label className="field">
                      <span>Nome ou iniciais nas etiquetas</span>
                      <input
                        value={filho.nomeOuIniciais}
                        onChange={(e) =>
                          updateFilho(index, { nomeOuIniciais: e.target.value })
                        }
                        maxLength={40}
                        placeholder="Ex.: Maria S. ou M.S."
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Escola</span>
                      <select
                        value={filho.escola}
                        onChange={(e) =>
                          updateFilho(index, { escola: e.target.value })
                        }
                        required
                      >
                        <option value="">Selecione a escola</option>
                        {ESCOLAS_JUNDIAI.map((escola) => (
                          <option key={escola} value={escola}>
                            {escola}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Turma (opcional)</span>
                      <input
                        value={filho.turma}
                        onChange={(e) =>
                          updateFilho(index, { turma: e.target.value })
                        }
                        maxLength={30}
                        placeholder="Ex.: 2º ano A"
                      />
                    </label>
                  </div>
                </fieldset>
              ))}

              {filhos.length < SITE.maxFilhos && (
                <button type="button" className="btn-secondary w-full" onClick={addFilho}>
                  + Quero etiquetas para outro filho
                </button>
              )}

              <p className="form-gift-total">
                🎉 Seu kit terá <strong>{totalEtiquetas} etiquetas personalizadas</strong>
              </p>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <button type="button" className="btn-primary w-full" onClick={goStep2}>
                Continuar meu pedido
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <label className="field">
                <span>Nome completo do responsável</span>
                <input
                  value={responsavelNome}
                  onChange={(e) => setResponsavelNome(e.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
              <label className="field">
                <span>WhatsApp</span>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(maskWhatsApp(e.target.value))}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="(11) 99999-9999"
                  required
                />
              </label>
              <label className="field">
                <span>E-mail (opcional)</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field sm:col-span-1">
                  <span>CEP</span>
                  <input
                    value={cep}
                    onChange={(e) => {
                      const next = maskCep(e.target.value);
                      setCep(next);
                      if (onlyDigits(next).length === 8) void lookupCep(next);
                    }}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="13200-000"
                    required
                  />
                </label>
                <label className="field">
                  <span>Número</span>
                  <input
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    autoComplete="address-line2"
                    required
                  />
                </label>
              </div>
              {cepStatus && <p className="text-sm text-[var(--accent)]">{cepStatus}</p>}

              <label className="field">
                <span>Rua</span>
                <input
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  autoComplete="address-line1"
                  required
                />
              </label>
              <label className="field">
                <span>Complemento (opcional)</span>
                <input
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Apto, bloco..."
                />
              </label>
              <label className="field">
                <span>Bairro</span>
                <input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  autoComplete="address-level2"
                  required
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="field">
                  <span>Cidade</span>
                  <input value="Jundiaí" disabled readOnly />
                </label>
                <label className="field">
                  <span>UF</span>
                  <input value="SP" disabled readOnly />
                </label>
              </div>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={consentimento}
                  onChange={(e) => setConsentimento(e.target.checked)}
                />
                <span>
                  Li e aceito a{" "}
                  <Link href="/privacidade" className="underline underline-offset-2">
                    política de privacidade
                  </Link>{" "}
                  e autorizo o contato sobre esta solicitação.
                </span>
              </label>

              <p className="text-sm text-[var(--muted)]">
                Tudo certo! Vamos preparar suas {totalEtiquetas} etiquetas e avisar
                pelo WhatsApp quando estiverem a caminho. Prazo estimado:{" "}
                {SITE.prazoEstimado}.
              </p>

              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="btn-secondary flex-1"
                  onClick={() => {
                    setError(null);
                    setStep(1);
                    irParaTopoDoFormulario();
                  }}
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={submitting}
                >
                  {submitting ? "Enviando..." : "Pedir minhas etiquetas"}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
