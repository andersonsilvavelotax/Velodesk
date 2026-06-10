# Velodesk V2.0.1 — Notas de versão

Data de referência: março de 2026.

Esta versão consolida as melhorias feitas no **frontend** (`login-simple-fixed.js`, `styles.css`) na visualização de tickets em aba, formulário lateral, histórico e tabulação.

---

## Layout e ticket (aba)

- Coluna principal e sidebar com mais espaço; sidebar com largura em `clamp`; rolagem única no painel lateral.
- Rodapé fixo do ticket respeitado com `padding`/`scroll-padding` na coluna principal.

## Informações do cliente (sidebar)

- Bloco alinhado ao mesmo “quadro” dos **Campos do Formulário** (gradiente e borda).
- Campos mais compactos (`gap` reduzido, inputs no estilo `ticket-form-field`).

## Histórico estilo Octadesk

- Timeline com data/hora, avatar, cartões com faixa colorida (público / interna / abertura).
- **Sem scroll próprio** no `.timeline-container`: o histórico rola com a coluna principal.

## Mensagens cliente × equipe

- Mensagens do **cliente** à esquerda; **nossas** (público e interno) à direita; sistema em largura total.
- Suporte a `sender: 'them'`, `fromClient`, `type: 'client'` em `messages`.
- Respostas públicas gravadas com `sender: 'me'`.

## Painel de resposta

- Avatar + caixa bordada; abas “Resposta pública” / “Anotação interna” com estilo tipo nav-tabs.

## Tabulação e formulário

- **`getCurrentTicketId`**: funciona na **aba do ticket**, não só no modal — salvamento em tempo real dos campos (incluindo árvore) passa a gravar corretamente.
- **`mergeTicketFormDataFromContainer`** / **`getTicketFormFieldValue`**: coleta **caminho completo** em árvores sequenciais e em cascata ao salvar.
- **Meta “Tabulação”** nas informações do ticket (campo com label “Tabulação” ou primeiro campo em árvore).
- **Caminho completo na árvore**:
  - `findPathFromStoredTreeValue` interpreta valores `"N1 > N2 > N3"`.
  - `handleTreeLevelChange` e `selectTreeNode` persistem o **path completo**.
  - Reconstrução da UI da árvore com todos os níveis selecionados.
- CSS: linha de tabulação em largura total na grade de meta, texto sem truncagem forçada.

---

## Arquivos principais desta release

| Arquivo | Alterações |
|---------|------------|
| `V2/login-simple-fixed.js` | Timeline Octadesk, lados cliente/equipe, tabulação, árvore, `getCurrentTicketId`, merge de formulário |
| `V2/styles.css` | Layout ticket, Octadesk, painel resposta, meta tabulação, cliente |

---

## Tag Git sugerida

```bash
git tag -a v2.0.1 -m "Velodesk V2.0.1 — ticket UI, tabulação completa, histórico Octadesk"
```
