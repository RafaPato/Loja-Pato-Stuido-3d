# Loja Pato Studio 3D

Calculadora de preços para peças de impressão 3D. Ferramenta avulsa em HTML puro (sem build,
sem dependências de servidor) — abra o arquivo direto no navegador ou publique via GitHub Pages.

## O que ela calcula

A partir dos custos de produção, sugere o preço de venda para a margem de lucro desejada:

- **Filamento**: preço por kg × peso da peça
- **Máquina**: tempo de impressão × custo por hora (energia + depreciação do equipamento)
- **Falhas e reimpressões**: % aplicado sobre filamento + tempo de máquina
- **Mão de obra**: pós-processamento, montagem, pintura
- **Embalagem** e **envio**
- **Taxa da plataforma/marketplace** e **margem de lucro desejada**, ambas como % do preço final

O preço sugerido usa:

```
preço = custo total ÷ (1 − (taxa% + margem%) / 100)
```

já que a taxa da plataforma e a margem incidem sobre o preço de venda, não sobre o custo. A
página também mostra o preço mínimo (que só cobre custo + taxa, sem lucro) e avisa quando
taxa + margem somam 100% ou mais, situação em que não existe preço final possível.

## Como usar

Abra `index.html` no navegador — não precisa de instalação, servidor ou internet (exceto para
carregar as fontes do Google Fonts). Os valores digitados ficam salvos no `localStorage` do
navegador entre uma visita e outra.

Para publicar como página web, ative o GitHub Pages deste repositório apontando para a branch
`main` / pasta raiz.
