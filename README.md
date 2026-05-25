# SDS Markdown & Math Parser

A lightweight, high-performance browser-side Markdown parser optimized for isolating financial metrics, tickers, and inline math notation without breaking standard currency values.

## Dependencies

This parser relies on **KaTeX** and its associated **Auto-Render Extension** to handle downstream mathematical typesetting. Ensure the following stylesheets and scripts are present in your document context prior to executing `renderToElement`:

```html
<link rel="stylesheet" href="[https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css](https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css)">

<script defer src="[https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js](https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js)"></script>

<script defer src="[https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js](https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js)"></script>
```

## Quickstart Usage

```
import { SDS_Parser } from './sds-parser.js';

const targetContainer = document.getElementById('output');
const rawMarkdown = "Check out $BTC at **$65,000**. Dynamic variation modeled via $E = mc^2$.";

// Renders the elements and automatically triggers the KaTeX post-processing layer
SDS_Parser.renderToElement(rawMarkdown, targetContainer);
```

