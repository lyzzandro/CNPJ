import { useMemo, useState } from "react";

const API_URL = "/api/cnpj";

function onlyDigits(value = "") {
  return value.replace(/\D/g, "");
}

function maskCNPJ(value = "") {
  const digits = onlyDigits(value).slice(0, 14);

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskCEP(value = "") {
  const digits = onlyDigits(String(value)).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

function formatPhone(ddd, phone) {
  if (!phone) return null;

  const cleanedDDD = onlyDigits(String(ddd || ""));
  const cleanedPhone = onlyDigits(String(phone));

  if (!cleanedDDD) return cleanedPhone;
  return `(${cleanedDDD}) ${cleanedPhone}`;
}

function isValidCNPJ(cnpj) {
  const digits = onlyDigits(cnpj);

  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  const calcDigit = (base, weights) => {
    const sum = weights.reduce((acc, weight, index) => {
      return acc + Number(base[index]) * weight;
    }, 0);

    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const firstDigit = calcDigit(digits.slice(0, 12), [
    5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);

  const secondDigit = calcDigit(digits.slice(0, 13), [
    6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2,
  ]);

  return firstDigit === Number(digits[12]) && secondDigit === Number(digits[13]);
}

function humanizeKey(key = "") {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isFilled(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string" && value.trim() === "") return false;
  if (Array.isArray(value) && value.length === 0) return false;

  if (
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  ) {
    return false;
  }

  return true;
}

function countFilledFields(value) {
  if (!isFilled(value)) return 0;

  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countFilledFields(item), 0);
  }

  if (typeof value === "object") {
    return Object.values(value).reduce(
      (total, item) => total + countFilledFields(item),
      0
    );
  }

  return 1;
}

function formatDate(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return value;

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

function formatCapitalSocial(value) {
  const number = Number(value);

  if (Number.isNaN(number)) return value;

  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatPrimitiveValue(value, fieldKey = "") {
  const key = fieldKey.toLowerCase();

  if (value === null || value === undefined || value === "") {
    return "Não informado";
  }

  if (typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }

  if (key.includes("capital_social")) {
    return formatCapitalSocial(value);
  }

  if (key.includes("cnpj") && onlyDigits(String(value)).length === 14) {
    return maskCNPJ(value);
  }

  if (key.includes("cep") && onlyDigits(String(value)).length === 8) {
    return maskCEP(value);
  }

  if (
    key.includes("data") ||
    key.includes("date") ||
    /^\d{4}-\d{2}-\d{2}/.test(String(value))
  ) {
    return formatDate(value);
  }

  if (typeof value === "number") {
    return value.toLocaleString("pt-BR");
  }

  return String(value);
}

function Badge({ children, tone = "default" }) {
  const tones = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    dark: "bg-slate-900 text-white border-slate-700",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

function InfoCard({ label, value, full = false }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        full ? "md:col-span-2" : ""
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value || "Não informado"}
      </p>
    </div>
  );
}

function DynamicValue({ label, value, level = 0 }) {
  const isObject =
    value !== null && typeof value === "object" && !Array.isArray(value);

  if (Array.isArray(value)) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-semibold text-slate-800">{humanizeKey(label)}</h4>
          <Badge tone="blue">{value.length} item(ns)</Badge>
        </div>

        {value.length === 0 ? (
          <p className="text-sm text-slate-500">Lista vazia</p>
        ) : (
          <div className="space-y-3">
            {value.map((item, index) => (
              <div
                key={`${label}-${index}`}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <p className="mb-2 text-xs font-bold uppercase text-slate-400">
                  Item {index + 1}
                </p>

                <DynamicValue
                  label={`${label}_${index}`}
                  value={item}
                  level={level + 1}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isObject) {
    const entries = Object.entries(value);

    return (
      <div
        className={`rounded-2xl border border-slate-200 bg-white p-4 ${
          level === 0 ? "shadow-sm" : ""
        }`}
      >
        {label && level > 0 && (
          <h4 className="mb-3 font-semibold text-slate-800">
            {humanizeKey(label)}
          </h4>
        )}

        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">Objeto vazio</p>
        ) : (
          <div className="grid gap-3">
            {entries.map(([key, item]) => (
              <DynamicValue
                key={`${label}-${key}`}
                label={key}
                value={item}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-sm font-medium text-slate-500">
        {humanizeKey(label)}
      </span>
      <span className="break-words text-left text-sm font-semibold text-slate-800 sm:max-w-[60%] sm:text-right">
        {formatPrimitiveValue(value, label)}
      </span>
    </div>
  );
}

function JsonRawView({ data }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-2xl border border-slate-200 bg-slate-950 p-5 text-xs leading-relaxed text-slate-100 shadow-sm">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-8 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-500">
        CNPJ
      </div>

      <h2 className="text-xl font-bold text-slate-900">
        Consulte dados públicos de uma empresa
      </h2>

      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        Digite um CNPJ válido para visualizar um resumo profissional e todos os
        dados completos retornados pela API, incluindo objetos, listas e campos
        variáveis.
      </p>
    </div>
  );
}

export default function App() {
  const [cnpj, setCnpj] = useState("");
  const [company, setCompany] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const establishment = company?.estabelecimento;

  const phones = useMemo(() => {
    if (!establishment) return [];

    return [
      formatPhone(establishment.ddd1, establishment.telefone1),
      formatPhone(establishment.ddd2, establishment.telefone2),
    ].filter(Boolean);
  }, [establishment]);

  const address = useMemo(() => {
    if (!establishment) return "";

    const parts = [
      establishment.tipo_logradouro,
      establishment.logradouro,
      establishment.numero,
      establishment.complemento,
      establishment.bairro,
      establishment.cep ? `CEP ${maskCEP(establishment.cep)}` : null,
    ].filter(Boolean);

    return parts.join(", ");
  }, [establishment]);

  const cityUf = useMemo(() => {
    const city = establishment?.cidade?.nome;
    const uf = establishment?.estado?.sigla;

    if (city && uf) return `${city}/${uf}`;
    return city || uf || "";
  }, [establishment]);

  const mainCnae = useMemo(() => {
    const cnae = establishment?.atividade_principal;

    if (!cnae) return "";

    const code = cnae.subclasse || cnae.codigo || "";
    const description = cnae.descricao || "";

    return [code, description].filter(Boolean).join(" - ");
  }, [establishment]);

  const stateRegistrations = useMemo(() => {
    const list = establishment?.inscricoes_estaduais || [];

    if (!Array.isArray(list) || list.length === 0) {
      return "Não informado";
    }

    return list
      .map((item) => {
        const number = item.inscricao_estadual || item.numero || "Sem número";
        const uf = item.estado?.sigla || item.uf || "";
        const status =
          typeof item.ativo === "boolean" ? (item.ativo ? "Ativa" : "Inativa") : "";

        return [number, uf, status].filter(Boolean).join(" - ");
      })
      .join(" | ");
  }, [establishment]);

  const filledFields = useMemo(() => {
    if (!company) return 0;
    return countFilledFields(company);
  }, [company]);

  async function handleSubmit(event) {
    event.preventDefault();

    const cleanCNPJ = onlyDigits(cnpj);

    setError("");
    setCopied(false);
    setShowRawJson(false);

    if (cleanCNPJ.length !== 14) {
      setError("Digite um CNPJ com 14 números.");
      return;
    }

    if (!isValidCNPJ(cleanCNPJ)) {
      setError("O CNPJ informado não é válido. Confira os números e tente novamente.");
      return;
    }

    try {
      setLoading(true);
      setCompany(null);

      const response = await fetch(`${API_URL}/${cleanCNPJ}`);
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(
            "Limite de consultas atingido na API pública. Aguarde um pouco e tente novamente."
          );
        }

        throw new Error(
          payload?.detalhes ||
            payload?.message ||
            payload?.erro ||
            `Não foi possível consultar este CNPJ. Erro ${response.status}.`
        );
      }

      setCompany(payload);
    } catch (err) {
      setError(
        err?.message ||
          "Ocorreu um erro inesperado ao consultar o CNPJ. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyJson() {
    if (!company) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(company, null, 2));
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setError("Não foi possível copiar o JSON neste navegador.");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_35%),linear-gradient(180deg,#f8fafc,#e2e8f0)] px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-soft">
          <div className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-8 lg:px-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/2 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge tone="blue">Consulta pública de CNPJ</Badge>

                <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                  Consulte empresas com uma interface moderna, completa e
                  responsiva
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                  Veja um resumo executivo da empresa e navegue automaticamente
                  por todos os campos retornados pela API, mesmo quando o JSON
                  variar entre CNPJs diferentes.
                </p>
              </div>

              {company && (
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-300">
                    Campos preenchidos
                  </p>
                  <p className="mt-1 text-3xl font-black">{filledFields}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="relative mt-8">
              <div className="flex flex-col gap-3 rounded-3xl bg-white p-2 shadow-lg sm:flex-row">
                <input
                  value={cnpj}
                  onChange={(event) => setCnpj(maskCNPJ(event.target.value))}
                  placeholder="Digite o CNPJ: 00.000.000/0000-00"
                  inputMode="numeric"
                  className="min-h-14 flex-1 rounded-2xl border border-transparent bg-slate-50 px-4 text-base font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-14 rounded-2xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? "Consultando..." : "Consultar"}
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
            </form>
          </div>

          <div className="p-5 sm:p-8 lg:p-10">
            {loading && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-2xl bg-slate-200"
                  />
                ))}
              </div>
            )}

            {!loading && !company && <EmptyState />}

            {!loading && company && (
              <div className="space-y-8">
                <section>
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                        Resumo da empresa
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-slate-900">
                        {company.razao_social || "Empresa consultada"}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge
                        tone={
                          establishment?.situacao_cadastral === "Ativa"
                            ? "success"
                            : "warning"
                        }
                      >
                        {establishment?.situacao_cadastral || "Situação não informada"}
                      </Badge>

                      {company.capital_social && (
                        <Badge>
                          Capital: {formatCapitalSocial(company.capital_social)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InfoCard label="Razão social" value={company.razao_social} />
                    <InfoCard
                      label="Nome fantasia"
                      value={establishment?.nome_fantasia}
                    />
                    <InfoCard
                      label="Situação cadastral"
                      value={establishment?.situacao_cadastral}
                    />
                    <InfoCard label="Cidade/UF" value={cityUf} />
                    <InfoCard label="Endereço" value={address} full />
                    <InfoCard label="CNAE principal" value={mainCnae} full />
                    <InfoCard
                      label="Telefone"
                      value={phones.length ? phones.join(" | ") : ""}
                    />
                    <InfoCard label="E-mail" value={establishment?.email} />
                    <InfoCard
                      label="Inscrições estaduais"
                      value={stateRegistrations}
                      full
                    />
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
                        Dados completos
                      </p>
                      <h3 className="mt-1 text-xl font-black text-slate-900">
                        Renderização automática do JSON
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Esta seção percorre objetos, listas e listas de objetos
                        sem depender de campos fixos.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowRawJson((current) => !current)}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                      >
                        {showRawJson ? "Ver dados formatados" : "Ver JSON bruto"}
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyJson}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700"
                      >
                        {copied ? "JSON copiado" : "Copiar JSON"}
                      </button>
                    </div>
                  </div>

                  {showRawJson ? (
                    <JsonRawView data={company} />
                  ) : (
                    <div className="grid gap-4">
                      <DynamicValue label="" value={company} />
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
