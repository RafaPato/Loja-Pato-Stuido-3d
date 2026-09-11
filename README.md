# Loja Pato Studio 3D

Calculadora de preços para peças de impressão 3D. Ferramenta avulsa em HTML puro (sem build,
sem dependências de servidor) — abra o arquivo direto no navegador ou publique via GitHub Pages.

`index.html`, na raiz, é sempre a **versão mais recente**. Versões anteriores ficam preservadas
em `versions/`, veja o histórico abaixo.

## O que ela calcula (v2 — atual)

A partir dos custos de produção, sugere o preço de venda para a margem de lucro desejada:

- **Filamento**: preço por kg × peso da peça
- **Máquina**: tempo de impressão × custo por hora (energia + depreciação do equipamento)
- **Falhas e reimpressões**: % aplicado sobre filamento + tempo de máquina
- **Mão de obra**: pós-processamento, montagem, pintura
- **Embalagem** e **envio**
- **Taxa da plataforma/marketplace** (%) e **taxa fixa por venda** (R$) — ex: gateway de pagamento
- **Margem de lucro desejada** (%)
- **Meta de lucro** (R$) → calcula a **quantidade necessária** de vendas para bater a meta
  (arredondada para cima) e as horas de impressão correspondentes
- **Lucro por hora de impressão**, para comparar a produtividade entre peças diferentes

O preço sugerido usa:

```
preço = (custo total + taxa fixa) ÷ (1 − (taxa% + margem%) / 100)
```

já que a taxa percentual da plataforma e a margem incidem sobre o preço de venda (não sobre o
custo), enquanto a taxa fixa é somada ao custo antes da divisão. A página também mostra o preço
mínimo (que só cobre custo + taxas, sem lucro) e avisa quando taxa% + margem somam 100% ou mais,
situação em que não existe preço final possível.

## Como usar

Abra `index.html` no navegador — não precisa de instalação, servidor ou internet (exceto para
carregar as fontes do Google Fonts). Os valores digitados ficam salvos no `localStorage` do
navegador entre uma visita e outra.

Para publicar como página web, ative o GitHub Pages deste repositório apontando para a branch
`main` / pasta raiz.

## Comparador de preços de insumos

`comparador-precos.html` mostra, por material (filamento PLA, PETG, papelão, plástico bolha), o
menor preço encontrado entre fornecedores, normalizado por kg/m/unidade para comparar anúncios com
quantidades diferentes.

- **Dados**: `data/precos.json` — pode ser editado à mão a qualquer momento (cotações com
  `"source": "manual"` nunca são apagadas automaticamente).
- **Coleta automática**: `scripts/collect-prices.mjs`, rodado uma vez por dia pelo workflow
  [`collect-prices.yml`](.github/workflows/collect-prices.yml) (ou manualmente via
  "Run workflow" na aba Actions). Hoje busca na API pública do Mercado Livre; novos fornecedores
  entram adicionando um conector em `scripts/lib/connectors/` e um item em
  `scripts/lib/materials.mjs`.
  - Se a busca do Mercado Livre responder 403 (a API pode exigir autenticação dependendo do IP/
    política vigente), registre uma aplicação em https://developers.mercadolivre.com.br, gere um
    access token e adicione como secret `MERCADO_LIVRE_ACCESS_TOKEN` no repositório — o conector
    já usa esse token automaticamente quando presente.
- **Segurança da coleta**: toda requisição de rede passa por `scripts/lib/safe-fetch.mjs`, que só
  aceita hosts de uma allow-list fixa (definida em cada conector) e resolve/valida o IP de destino
  antes de conectar, recusando IPs privados/loopback/link-local — proteção contra SSRF, já que o
  coletor roda com acesso à rede em CI. Rodar `npm test` (ou `node --test scripts/lib/*.test.mjs`)
  cobre essas validações e a heurística de normalização de unidade.

## Análise de mercado

`analise-mercado.html` vai além do menor preço: mostra distribuição de preço (mínimo, mediana,
máximo), ranking de vendedores mais presentes e % de anúncios em promoção, por material, a partir
de uma amostra maior de anúncios do Mercado Livre (até 50 por consulta).

- **Dados**: `data/analise-mercado.json`, gerado por `scripts/analyze-market.mjs` e atualizado
  semanalmente pelo workflow [`market-analysis.yml`](.github/workflows/market-analysis.yml) — é
  mais pesado que o log diário de preço, por isso não roda todo dia.
- **Por que só Mercado Livre**: é a única das duas plataformas-alvo com API pública de busca. A
  Shopee não tem API de busca de mercado para terceiros (só Open Platform para a própria loja, ou
  Affiliate API para produtos que você promove) — usar um scraper de terceiro contra ela foi
  descartado por risco de Termos de Uso. A leitura de Shopee é qualitativa, via busca na web, feita
  por uma rotina separada (fora deste repositório), não por este motor.
- **Estatística**: `scripts/lib/market-analysis.mjs` (percentis de preço, ranking de vendedores,
  taxa de desconto, e mais vendidos por `sold_quantity`), coberto por testes
  (`node --test scripts/lib/*.test.mjs`).
- **"Mais vendidos"** usa `sold_quantity` — o único sinal de demanda que a busca pública do
  Mercado Livre expõe. Não existe "visitas ao perfil" disponível para anúncios de terceiros (só o
  próprio dono da loja vê isso, via API autenticada com escopo de vendas).
- Reaproveita o mesmo `MERCADO_LIVRE_ACCESS_TOKEN` do comparador de preços — sem o secret
  configurado, o Mercado Livre pode recusar a busca (403) e a página mostra o motivo em vez de
  dado vazio silencioso.

## Oportunidades de produto

`oportunidades-produto.html` vai um passo além da análise de insumo: para peças 3D genéricas
cadastradas em `scripts/lib/product-ideas.mjs`, busca o que já se vende parecido no Mercado Livre
e estima uma **margem bruta simplificada**, comparando o preço mediano observado com um custo de
produção baseado em premissas de peso/tempo de impressão que você cadastra.

- **Isto não é o preço final da peça** — só filamento + tempo de máquina entram na conta (sem mão
  de obra, embalagem, envio ou taxa de plataforma). Para o cálculo completo de uma peça
  específica, use o [Precificador 3D](./index.html). Trate a margem aqui como triagem: "vale a
  pena olhar melhor" ou não.
- **Premissas editáveis**: cada item em `scripts/lib/product-ideas.mjs` tem `estimatedWeightGrams`
  e `estimatedPrintHours` — são só exemplos até você editar com os valores reais da sua peça. O
  custo do filamento usado na conta vem do menor preço confirmado hoje em `data/precos.json` para
  o `materialId` do item (PLA ou PETG).
- **Dados**: `data/oportunidades-produto.json`, gerado por
  `scripts/analyze-product-opportunities.mjs`, atualizado no mesmo workflow semanal da análise de
  mercado.
- **Estatística de custo/margem**: `scripts/lib/margin-analysis.mjs`, coberto por testes.

## Histórico de versões

| Versão | Pasta | O que tem |
| --- | --- | --- |
| **v2** (atual) | [`versions/v2`](./versions/v2) | Tudo da v1, mais taxa fixa por venda, meta de lucro, quantidade necessária e lucro por hora de impressão |
| v1 | [`versions/v1`](./versions/v1) | Filamento, máquina, falhas, mão de obra, embalagem, envio, taxa da plataforma (%) e margem de lucro |

`versions/vN` são snapshots congelados de cada versão — não são atualizados depois de publicados.
Use-os para comparar mudanças ou voltar a uma versão anterior; o `index.html` da raiz é sempre a
cópia da versão mais recente.
