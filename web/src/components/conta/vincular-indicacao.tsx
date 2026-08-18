"use client";

import { useEffect } from "react";
import { vincularIndicacaoDoCookie } from "@/app/conta/indicacao-acoes";

/** Liga o cookie de convite à conta sem alterar cookie no render da página. */
export function VincularIndicacaoAoMontar() {
  useEffect(() => {
    void vincularIndicacaoDoCookie();
  }, []);
  return null;
}
