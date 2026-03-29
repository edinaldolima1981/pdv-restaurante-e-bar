import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction } from '../types';
import { formatCurrency } from './utils';

export const generateAccountingPDF = (transactions: Transaction[], monthYear: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('65.453.393 DANIELA FREITAS DA SILVA', pageWidth / 2, 20, { align: 'center' });

  // Subheader
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`EXTRATO DE FATURAMENTO / FLUXO DE CAIXA - ${monthYear.toUpperCase()}`, 14, 35);

  // Table Data
  const tableData = transactions.map((t, index) => {
    const date = new Date(t.date);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const dayOfWeek = date.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase();
    
    // Calculate running balance (simplified for this view)
    const runningBalance = transactions.slice(0, index + 1).reduce((sum, curr) => {
      return sum + (curr.type === 'income' ? curr.amount : -curr.amount);
    }, 0);

    return [
      `${day}/${month}/${year}`,
      dayOfWeek,
      t.type === 'income' ? formatCurrency(t.amount) : 'R$ -',
      t.type === 'expense' ? formatCurrency(t.amount) : 'R$ -',
      formatCurrency(runningBalance),
      t.description
    ];
  });

  // AutoTable
  autoTable(doc, {
    startY: 45,
    head: [['DATA', 'DIA', 'FATUR. BRUTO', 'SAÍDA', 'SALDO', 'DESCRIÇÃO']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineWidth: 0.1,
      lineColor: [0, 0, 0]
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 25 },
      1: { cellWidth: 15 },
      2: { cellWidth: 30, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
      4: { cellWidth: 30, halign: 'right' },
      5: { cellWidth: 'auto' }
    }
  });

  // Footer - Total líquido
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastAutoTable = (doc as any).lastAutoTable;
  const finalY = lastAutoTable ? lastAutoTable.finalY : 45;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netTotal = totalIncome - totalExpense;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Total líquido do período', 14, finalY + 10);
  doc.text(formatCurrency(netTotal), pageWidth - 14, finalY + 10, { align: 'right' });

  // Draw footer line
  doc.setLineWidth(0.5);
  doc.line(14, finalY + 12, pageWidth - 14, finalY + 12);

  doc.save(`Relatorio_Contador_${monthYear.replace('/', '_')}.pdf`);
};
