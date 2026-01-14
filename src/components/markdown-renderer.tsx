'use client';

export function MarkdownRenderer({ content }: { content: string }) {
    if (!content) return <div className="text-sm text-muted-foreground italic">Preview will appear here...</div>;

    const renderMarkdown = (text: string) => {
        let html = text
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-1">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-5 mb-2">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-6 mb-3">$1</h1>')
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto my-4 rounded-md shadow-sm" />')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
            .replace(/^(-{3,}|\*{3,})$/gm, '<hr class="my-6" />');

        // Process lists as blocks
        html = html.replace(/^( *[-*+] .*\n?)+/gm, (match) => {
            const items = match.trim().split('\n').map(item =>
                `<li>${item.replace(/^ *[-*+] /, '').trim()}</li>`
            ).join('');
            return `<ul class="list-disc pl-5 space-y-1 my-4">${items}</ul>`;
        });

        html = html.replace(/^( *\d+\. .*\n?)+/gm, (match) => {
            const items = match.trim().split('\n').map(item =>
                `<li>${item.replace(/^ *\d+\. /, '').trim()}</li>`
            ).join('');
            return `<ol class="list-decimal pl-5 space-y-1 my-4">${items}</ol>`;
        });
        
        // Process paragraphs
        html = html.split('\n').map(line => {
            if (line.trim().startsWith('<') || line.trim() === '') return line;
            return `<p class="leading-relaxed">${line}</p>`;
        }).join('');

        // Cleanup empty paragraphs that might be generated
        html = html.replace(/<p><\/p>/g, '');

        return { __html: html };
    };

    return (
        <div
            className="prose prose-slate max-w-none space-y-4"
            dangerouslySetInnerHTML={renderMarkdown(content)}
        />
    );
}
