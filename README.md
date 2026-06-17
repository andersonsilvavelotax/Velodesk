# Projeto Velodesk

Sistema de helpdesk com tickets, Kanban, formulário lateral e ecossistema V3.

## Estrutura

```
Velodesk/          ← aplicação principal (frontend + backend)
Velodesk-cockpit/  ← cockpit operacional Velotax (porta 8768)
Velodesk-lab/      ← sandbox isolado para testes (porta 8767)
  prototipo/       ← módulos do protótipo V3 (ecossistema, desk experience)
  backend/         ← API Node.js
```

## Início rápido

**App principal:**
```bash
cd Velodesk
npx serve -l 8766
```

**Lab (testes / experimentos):**
```bash
cd Velodesk-lab
start-lab.bat
```
Abra http://localhost:8767 — localStorage separado do app principal.

**Cockpit (operacional / Velotax):**
```bash
cd Velodesk-cockpit
start-cockpit.bat
```
Abra http://localhost:8768 — deploy em https://velodesk-cockpit.vercel.app

## Deploy (Vercel)

```bash
cd Velodesk
deploy-vercel.bat
```

URL de produção: https://velodesk-v2.vercel.app

## Repositório

https://github.com/andersonsilvavelotax/Velodesk
