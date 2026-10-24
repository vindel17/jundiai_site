"use client";

export function MarcarPagina() {
  return (
    <input
      type="checkbox"
      aria-label="Marcar as reservas desta página"
      onChange={(evento) => {
        const form = evento.currentTarget.form;
        if (!form) return;
        for (const campo of form.elements) {
          if (campo instanceof HTMLInputElement && campo.name === "ids") {
            campo.checked = evento.currentTarget.checked;
          }
        }
      }}
    />
  );
}
