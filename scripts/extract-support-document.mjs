// A short-lived process keeps document parser memory out of the web and agent worker.
const parts = [];
for await (const part of process.stdin) {
  parts.push(part);
  if (parts.reduce((n, p) => n + p.length, 0) > 4200000)
    throw new Error('File too large.');
}
const { format, base64 } = JSON.parse(Buffer.concat(parts).toString());
const buffer = Buffer.from(base64, 'base64');
if (buffer.length > 3000000) throw new Error('Use a document under 3 MB.');
let text = '';
if (format === 'pdf') {
  if (!buffer.subarray(0, 5).equals(Buffer.from('%PDF-')))
    throw new Error('The file is not a PDF.');
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loading = getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    useSystemFonts: false
  });
  const pdf = await loading.promise;
  if (pdf.numPages > 30) throw new Error('Use a PDF with at most 30 pages.');
  for (let page = 1; page <= pdf.numPages; page++) {
    const content = await (await pdf.getPage(page)).getTextContent();
    text +=
      `\n[Page ${page}]\n` +
      content.items.map((i) => i.str + (i.hasEOL ? '\n' : ' ')).join('');
    if (text.length > 24000)
      throw new Error('Use at most 24,000 characters of text.');
  }
  await loading.destroy();
} else if (format === 'docx') {
  // Check declared ZIP expansion before a DOCX parser allocates its contents.
  let expanded = 0,
    entries = 0,
    hasDocument = false;
  for (let i = 0; i + 46 < buffer.length; i++) {
    if (buffer.readUInt32LE(i) !== 0x02014b50) continue;
    entries++;
    expanded += buffer.readUInt32LE(i + 24);
    const name = buffer
      .subarray(i + 46, i + 46 + buffer.readUInt16LE(i + 28))
      .toString();
    if (name === 'word/document.xml') hasDocument = true;
    if (
      expanded > 12000000 ||
      entries > 300 ||
      /vbaProject|embeddings\//i.test(name)
    )
      throw new Error('Document contents exceed supported limits.');
  }
  if (!hasDocument) throw new Error('The file is not a text DOCX document.');
  const mammoth = await import('mammoth');
  text = (await mammoth.extractRawText({ buffer })).value;
} else {
  if (buffer.includes(0)) throw new Error('Use a UTF-8 text file.');
  text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
}
if (text.replace(/\[Page \d+\]/g, '').trim().length < 20)
  throw new Error(
    'No usable text found. Scanned documents need a text version.'
  );
if (text.length > 24000)
  throw new Error('Use at most 24,000 characters of text.');
process.stdout.write(JSON.stringify({ text }));
