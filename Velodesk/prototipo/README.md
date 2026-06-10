# Protótipo Velodesk V3

Módulos experimentais e iterações do protótipo (ecossistema, desk experience).

## Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `ecosystem-prototype.js` / `.css` | Workspace 360°, Analytics IA, portal e fluxos do ecossistema |
| `desk-experience.js` / `.css` | Animações, transições e polish de UI |

## Uso

A aplicação principal em `../` já integra o núcleo V3 (`velodesk-ecosystem.js`, formulário lateral, abas de tickets).

Para testar os módulos isolados do protótipo, inclua no `index.html` da raiz:

```html
<link rel="stylesheet" href="prototipo/ecosystem-prototype.css">
<link rel="stylesheet" href="prototipo/desk-experience.css">
<script src="prototipo/ecosystem-prototype.js"></script>
<script src="prototipo/desk-experience.js"></script>
```

## Servidor local

```bash
cd ..
npx serve -l 8765
```

Abra http://localhost:8765
