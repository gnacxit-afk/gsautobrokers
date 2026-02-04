'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer({ content }: { content: string }) {
    if (!content) {
        return <div className="text-sm text-muted-foreground italic">Preview will appear here...</div>;
    }

    return (
        <div className="markdown-preview">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                    // You can add more component overrides here if needed
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
