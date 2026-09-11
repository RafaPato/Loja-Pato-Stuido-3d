// Catálogo dos insumos rastreados. Adicionar um novo material é só um novo item aqui —
// o `id` precisa bater com o `id` correspondente em data/precos.json.
export const MATERIALS = [
  {
    id: "filamento-pla-1kg",
    name: "Filamento PLA 1.75mm (1kg)",
    category: "filamento_pla",
    baseUnit: "kg",
    search: { connector: "mercado_livre", query: "filamento pla 1kg 1.75mm", limit: 5 },
  },
  {
    id: "filamento-petg-1kg",
    name: "Filamento PETG 1.75mm (1kg)",
    category: "filamento_petg",
    baseUnit: "kg",
    search: { connector: "mercado_livre", query: "filamento petg 1kg 1.75mm", limit: 5 },
  },
  {
    id: "papelao-onda-simples",
    name: "Caixa de papelão onda simples",
    category: "papelao",
    baseUnit: "unidade",
    search: { connector: "mercado_livre", query: "caixa papelao onda simples para envio", limit: 5 },
  },
  {
    id: "plastico-bolha-rolo",
    name: "Plástico bolha (rolo)",
    category: "plastico_bolha",
    baseUnit: "m",
    search: { connector: "mercado_livre", query: "plastico bolha rolo para embalagem", limit: 5 },
  },
];

export const CATEGORY_LABELS = {
  filamento_pla: "Filamento PLA",
  filamento_petg: "Filamento PETG",
  papelao: "Papelão",
  plastico_bolha: "Plástico bolha",
};
