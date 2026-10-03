'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

export default function MarkdownContent({ text }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ code: ({ children, className }) => <code className={className}>{String(children)}</code> }}>{text}</ReactMarkdown>;
}