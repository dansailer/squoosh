/** Strip leading indentation from template literal strings. */
export default function dedent(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  const raw = strings.reduce(
    (acc, str, i) => acc + str + (values[i] ?? ''),
    '',
  );
  const lines = raw.replace(/^\n/, '').split('\n');
  const indent = Math.min(
    ...lines
      .filter((line) => line.trim())
      .map((line) => line.match(/^(\s*)/)![1].length),
  );
  return lines.map((line) => line.slice(indent)).join('\n').trim();
}