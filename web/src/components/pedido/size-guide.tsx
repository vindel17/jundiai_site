"use client";

import { GUIA_TAMANHOS } from "@/data/catalogo";

type Props = {
  fotoNome?: string;
  onFoto: (name?: string) => void;
};

export function SizeGuide({ fotoNome, onFoto }: Props) {
  return (
    <div className="uj-size-help">
      <div className="uj-photo">
        <span className="uj-photo-icon" aria-hidden>
          📷
        </span>
        <span className="uj-photo-text">
          <strong>Não sabe o tamanho? Mande uma foto</strong>
          {fotoNome
            ? `Foto enviada: ${fotoNome}. A gente confere e responde o tamanho certo.`
            : "Fotografe uma peça que já serve, aberta sobre a mesa, com uma folha de caderno do lado. A gente mede pela foto e diz o tamanho certo."}
        </span>
        <label className="uj-photo-btn">
          {fotoNome ? "Trocar" : "Enviar foto"}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFoto(e.target.files?.[0]?.name)}
          />
        </label>
      </div>

      <p className="uj-promise">
        <strong>Errou o tamanho?</strong> É só manter a etiqueta na peça. A
        gente solicita a retirada e entrega a outra no tamanho certo.
      </p>

      <details className="uj-help">
        <summary>📏 Ver tabela por altura da criança</summary>
        <div className="uj-help-body">
          <table className="uj-help-table">
            <thead>
              <tr>
                <th>Tamanho</th>
                <th>Altura</th>
                <th>Idade</th>
              </tr>
            </thead>
            <tbody>
              {GUIA_TAMANHOS.map((linha) => (
                <tr key={linha.tamanho}>
                  <td>
                    <strong>{linha.tamanho}</strong>
                  </td>
                  <td>{linha.altura}</td>
                  <td>{linha.idade}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="uj-help-note">
            A tabela é só uma referência. O jeito mais certo é a foto da peça
            que já serve.
          </p>
        </div>
      </details>
    </div>
  );
}
