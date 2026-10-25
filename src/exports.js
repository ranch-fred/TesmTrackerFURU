import { jsPDF } from 'jspdf';
import { csvText } from './domain';
export function download(name, content, type = 'text/plain') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(name, rows, fields) {
  download(`${name}.csv`, '\uFEFF' + csvText(rows, fields), 'text/csv;charset=utf-8');
}
export function pdf(title, sections, team) {
  const doc = new jsPDF();
  let y = 24;
  function line(text, size = 10) {
    doc.setFontSize(size);
    const chunks = doc.splitTextToSize(String(text).replace(/[^\x20-\x7E\n]/g, ' '), 170);
    for (const chunk of chunks) {
      if (y > 275) {
        doc.addPage();
        y = 22;
      }
      doc.text(chunk, 20, y);
      y += size * 0.5 + 2;
    }
  }
  doc.setTextColor(235, 95, 0);
  line(team.name + ' #' + team.number, 18);
  doc.setTextColor(25);
  line(title, 14);
  line('Generated ' + new Date().toLocaleDateString());
  y += 5;
  for (const section of sections) {
    line(section.title, 13);
    for (const text of section.lines) line(text);
    y += 5;
  }
  doc.save(`${title.toLowerCase().replaceAll(' ', '-')}.pdf`);
}
