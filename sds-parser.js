/**
 * SDS Markdown & Math Parser | Version 1.8.2
 * Distributed under the Apache License 2.0
 */

export const SDS_Parser = {
    renderToElement: function(markdownText, container) {
        const html = this.render(markdownText);
        container.innerHTML = html;

        if (typeof window !== 'undefined' && window.renderMathInElement) {
            window.renderMathInElement(container, {
                delimiters: [
                    { left: "$$", right: "$$", display: true },
                    { left: "$", right: "$", display: false }
                ],
                ignoredClasses: ['sds-currency-prot'],
                throwOnError: false
            });
        }
    },

    render: function(text) {
        if (!text) return "";
        
        // Lock object context tracking down explicitly to prevent asynchronous scope decay
        const self = this;
        const localMathBlocks = [];

        // STEP 1: CURRENCY SHIELD
        let output = text.replace(/\$(?=\d)/g, '<span class="sds-currency-prot">&#36;</span>');

        // STEP 2: EXTRACT DOUBLE DOLLAR LATEX
        output = output.replace(/\$\$([\s\S]+?)\$\$/g, (m, g1) => {
            localMathBlocks.push({ math: g1, display: true });
            return `__MATH_BLOCK_${localMathBlocks.length - 1}__`;
        });

        // STEP 3: EXTRACT GENUINE LATEX (Single Dollars - Hardened)
        output = output.replace(/\$([^$\s](?:[^$]*[^$\s])?)\$/g, (m, g1) => {
            if (g1.match(/million|billion|trillion|percent|k\b|m\b|b\b/i)) return m;
            if (g1.length > 30 && !g1.match(/[+\-*\/=^_\\]/)) return m;
        
            localMathBlocks.push({ math: g1, display: false });
            return `__MATH_BLOCK_${localMathBlocks.length - 1}__`;
        });

        // STEP 4: STRUCTURAL PARSING
        let finalHtml = "";
        const lines = output.split('\n');
        let inList = false;

        lines.forEach(line => {
            const trimmed = line.trim();
            
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
                // Scope protected execution using locked self reference
                finalHtml += `<h${level}>${self.applyInlineRules(cleanText)}</h${level}>`;
            } 
            else if (trimmed.startsWith('>')) {
                finalHtml += `<blockquote>${self.applyInlineRules(trimmed.replace(/^>\s*/, ''))}</blockquote>`;
            } 
            else if (isListItem) {
                if (!inList) { 
                    finalHtml += '<ul>'; 
                    inList = true; 
                }
                finalHtml += `<li>${self.applyInlineRules(trimmed.replace(/^[-*]\s/, ''))}</li>`;
            } 
            else {
                finalHtml += `<p>${self.applyInlineRules(trimmed)}</p>`;
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
        t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');
        t = t.replace(/\[REDACTED\]/g, '<span class="sds-redacted" title="SECURITY_CLEARANCE_REQUIRED">XXXXXXXXXX</span>');
        t = t.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="sds-link" target="_blank">$1</a>');
    
        return t;
    }
};
