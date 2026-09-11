// Catálogo de "ideias de produto" observadas no mercado para estimar oportunidade de venda —
// NÃO é o catálogo de vendas do Pato Studio. Cada item aqui é uma peça 3D genérica que o motor
// de análise procura no Mercado Livre para ver preço praticado e volume de venda.
//
// estimatedWeightGrams / estimatedPrintHours são PREMISSAS SUAS, não medidas reais — o motor não
// tem como saber o peso/tempo de impressão de um anúncio de terceiro. Ajuste para os valores reais
// da sua peça antes de confiar na margem estimada; os valores abaixo são só exemplo de formato.
export const PRODUCT_IDEAS = [
  {
    id: "suporte-celular",
    name: "Suporte de celular de mesa (EXEMPLO — ajuste peso/tempo reais)",
    searchQuery: "suporte celular mesa impressora 3d",
    materialId: "filamento_pla",
    estimatedWeightGrams: 60,
    estimatedPrintHours: 3,
  },
  {
    id: "organizador-mesa",
    name: "Organizador de mesa (EXEMPLO — ajuste peso/tempo reais)",
    searchQuery: "organizador mesa impressao 3d",
    materialId: "filamento_pla",
    estimatedWeightGrams: 150,
    estimatedPrintHours: 6,
  },
];

// Custo de máquina por hora usado na estimativa de margem quando nenhum valor mais preciso é
// informado — mesmo valor de exemplo já usado como placeholder no Precificador 3D (index.html).
export const DEFAULT_MACHINE_COST_PER_HOUR_CENTS = 180;
