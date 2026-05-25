/**
 * SDS Markdown & Math Parser | Version 1.8.1
 * Distributed under the Apache License 2.0
 */

let _mathBlocks = [];

export const SDS_Parser = {
    renderToElement: function(markdownText, container) {
        const html = this.render(markdownText);
        container.innerHTML = html;

        // Graceful dependency checking for browser environment
        if (typeof window !== 'undefined' && window.renderMathInElement) {
            window.renderMathInElement(container, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ],
                ignoredClasses: ['sds-currency-prot'],
                throwOnError: false
            });
        } else if (typeof window !== 'undefined' && !window.renderMathInElement) {
            console.warn("SDS_Parser Warning: KaTeX auto-render extension (renderMathInElement) not detected on window scope.");
        }
    },

    render: function(text) {
        if (!text) return "";
        
        // Scope state tracking locally to guarantee thread isolation
        const localMathBlocks = [];

        // STEP 1: CURRENCY SHIELD
        let output = text.replace(/\$(?=\d)/g, '<span class="sds-currency-prot">&#36;</span>');

        // STEP 2: EXTRACT DOUBLE DOLLAR LATEX
        output = output.replace(/\$\$([\s\S]+?)\$\$/g, (m, g1) => {
            localMathBlocks.push({ math: g1, display: true });
            return `__MATH_BLOCK_${localMathBlocks.length - 1}__`;
        });

        // STEP 3: EXTRACT SINGLE DOLLAR LATEX
        output = output.replace(/\$([^\s][^$]+?)\$/g, (m, g1) => {
            if (g1.match(/million|billion|trillion|percent|k\b|m\b|b\b/i)) return m;
            localMathBlocks.push({ math: g1, display: false });
            return `__MATH_BLOCK_${localMathBlocks.length - 1}__`;
        });

        // STEP 4: STRUCTURAL PARSING
        let finalHtml = "";
        const lines = output.split('\n');
        let inList = false;

        lines.forEach(line => {
            const trimmed = line.trim();
            
            // Handle true paragraph separation
            if (!trimmed) {
                if (inList) {
                    finalHtml += '</ul>';
                    inList = false;
                }
                return;
            }

            const isListItem = trimmed.match(/^[-*]\s/);

            if (inList && !isListItem) {
                finalHtml += '</ul>';
                inList = false;
            }

            if (trimmed.startsWith('#')) {
                const level = (trimmed.match(/^#+/) || ['#'])[0].length;
                const cleanText = trimmed.replace(/^#+\s*/, '');
                finalHtml += `<h${level}>${this.applyInlineRules(cleanText)}</h${level}>`;
            } 
            else if (trimmed.startsWith('>')) {
                finalHtml += `<blockquote>${this.applyInlineRules(trimmed.replace(/^>\s*/, ''))}</blockquote>`;
            } 
            else if (isListItem) {
                if (!inList) { 
                    finalHtml += '<ul>'; 
                    inList = true; 
                }
                finalHtml += `<li>${this.applyInlineRules(trimmed.replace(/^[-*]\s/, ''))}</li>`;
            } 
            else {
                finalHtml += `<p>${this.applyInlineRules(trimmed)}</p>`;
            }
        });

        if (inList) finalHtml += '</ul>';

        // STEP 5: RE-INJECT SECURE MATH BLOCKS
        localMathBlocks.forEach((item, i) => {
            const className = item.display ? 'sds-math-block' : 'sds-math-inline';
            finalHtml = finalHtml.replace(`__MATH_BLOCK_${i}__`, `<span class="${className}">$${item.math}$</span>`);
        });

        return finalHtml;
    },

    applyInlineRules: function(text) {
        let t = text;

        t = t.replace(/\\(?=<span class="sds-currency-prot">)/g, '');
        t = t.replace(/\$([A-Z]{1,5})\b/g, '<span class="sds-ticker">$$$1</span>');
        t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        t = t.replace(/\[REDACTED\]/g, '<span class="sds-redacted" title="SECURITY_CLEARANCE_REQUIRED">XXXXXXXXXX</span>');
        t = t.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="sds-link" target="_blank">$1</a>');

        return t;
    }
};
