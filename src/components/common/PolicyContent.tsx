import React from 'react';

function inline(text: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) =>
    part.startsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> :
    part.startsWith('`') ? <code key={i}>{part.slice(1, -1)}</code> : part);
}

export function PolicyContent({ content }: { content: string }) {
  return <div className="space-y-3">{content.replace(/(^#{1,6} .+)\n(?=[-*] |\d+\. )/gm, '$1\n\n').split(/\n\s*\n/).filter(Boolean).map((block, i) => {
    const lines = block.trim().split('\n');
    if (lines.every(line => /^[-*] /.test(line.trim()))) return <ul key={i} className="list-disc pl-5 space-y-2">{lines.map((line, j) => <li key={j}>{inline(line.trim().slice(2))}</li>)}</ul>;
    if (lines.every(line => /^\d+\. /.test(line.trim()))) return <ol key={i} className="list-decimal pl-5 space-y-2">{lines.map((line, j) => <li key={j}>{inline(line.trim().replace(/^\d+\. /, ''))}</li>)}</ol>;
    return <div key={i} className="space-y-2">{lines.map((line, j) => /^#{1,6} /.test(line) ? <h4 key={j} className="font-bold text-stone-900">{inline(line.replace(/^#{1,6} /, ''))}</h4> : <p key={j}>{inline(line)}</p>)}</div>;
  })}</div>;
}
