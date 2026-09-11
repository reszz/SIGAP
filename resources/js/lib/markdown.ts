/**
 * Lightweight safe Markdown parser for SIGAP Article Content.
 * Escapes raw HTML to prevent XSS and transforms Markdown syntax into styled HTML.
 */
export function renderMarkdownToHtml(markdown: string): string {
    if (!markdown) return '';

    // 1. Escape HTML special characters
    let raw = markdown
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    // 2. Headings
    raw = raw.replace(
        /^### (.*$)/gim,
        '<h3 class="font-display text-lg font-semibold text-[#1E2430] dark:text-[#E6ECF5] mt-7 mb-2">$1</h3>',
    );
    raw = raw.replace(
        /^## (.*$)/gim,
        '<h2 class="font-display text-xl font-semibold text-[#1E2430] dark:text-[#E6ECF5] mt-9 mb-3">$1</h2>',
    );
    raw = raw.replace(
        /^# (.*$)/gim,
        '<h1 class="font-display text-2xl font-bold text-[#1E2430] dark:text-[#E6ECF5] mt-10 mb-4">$1</h1>',
    );

    // 3. Blockquotes
    raw = raw.replace(
        /^&gt; (.*$)/gim,
        '<blockquote class="border-l-4 border-[#4A5FD1] pl-4 py-2 my-5 italic text-[#4A5060] dark:text-[#9BA4B4] bg-[#F6F7F9]/80 dark:bg-[#181E2B]/80 rounded-r-md">$1</blockquote>',
    );

    // 4. Bold and Italic
    raw = raw.replace(
        /\*\*(.*?)\*\*/gim,
        '<strong class="font-semibold text-[#1E2430] dark:text-[#E6ECF5]">$1</strong>',
    );
    raw = raw.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

    // 5. Inline Code
    raw = raw.replace(
        /`([^`]+)`/gim,
        '<code class="rounded bg-[#F6F7F9] px-1.5 py-0.5 font-mono-sigap text-xs text-[#4A5FD1] dark:bg-[#21293A] dark:text-[#8FA0FA]">$1</code>',
    );

    // 6. Links [text](url) — ensuring safe protocols
    raw = raw.replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/gim,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#4A5FD1] underline underline-offset-2 hover:text-[#3E51BD] dark:text-[#8FA0FA] dark:hover:text-[#A8B7FC]">$1</a>',
    );

    // 7. Bullet lists and numbered lists
    raw = raw.replace(
        /^\s*[-*]\s+(.*$)/gim,
        '<li class="ml-5 list-disc text-sm leading-relaxed text-[#2E3542] dark:text-[#C5D0E0] my-1">$1</li>',
    );
    raw = raw.replace(
        /^\s*(\d+)\.\s+(.*$)/gim,
        '<li class="ml-5 list-decimal text-sm leading-relaxed text-[#2E3542] dark:text-[#C5D0E0] my-1">$2</li>',
    );

    // 8. Paragraphs and line breaks
    const blocks = raw.split(/\n\s*\n/);
    return blocks
        .map((block) => {
            const trimmed = block.trim();
            if (!trimmed) return '';
            if (
                trimmed.startsWith('<h') ||
                trimmed.startsWith('<blockquote') ||
                trimmed.startsWith('<li')
            ) {
                return trimmed;
            }
            return `<p class="my-4 text-sm leading-[1.8] text-[#2E3542] sm:text-base dark:text-[#C5D0E0]">${trimmed.replace(/\n/g, '<br/>')}</p>`;
        })
        .join('\n');
}
