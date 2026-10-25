import React, { useMemo, useState } from 'react';
import { marked } from 'marked';
import { Check, Copy } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Parse marked tokens or sanitized HTML
  const parsedHtml = useMemo(() => {
    try {
      marked.setOptions({
        gfm: true,
        breaks: true,
      });
      return marked.parse(content || '') as string;
    } catch {
      return content;
    }
  }, [content]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="relative">
      <div 
        className="markdown-body leading-relaxed select-text"
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />
    </div>
  );
};
