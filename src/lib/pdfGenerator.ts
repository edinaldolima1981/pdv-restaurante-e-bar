import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Transaction, Order } from '../types';
import { formatCurrency } from './utils';

export const generateAccountingPDF = (transactions: Transaction[], monthYear: string, initialBalance: number = 0) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header - Empresa
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('65.453.393 DANIELA FREITAS DA SILVA', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('RELATÓRIO DE MOVIMENTAÇÃO FINANCEIRA', pageWidth / 2, 28, { align: 'center' });
  doc.text(`PERÍODO: ${monthYear.toUpperCase()}`, pageWidth / 2, 34, { align: 'center' });

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 40, pageWidth - 14, 40);

  // Table Data
  // Sort transactions by date ascending for the report
  const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const tableData = sortedTransactions.map((t, index) => {
    const date = new Date(t.date);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Calculate running balance including initial balance
    const currentMonthFlow = sortedTransactions.slice(0, index + 1).reduce((sum, curr) => {
      return sum + (curr.type === 'income' ? curr.amount : -curr.amount);
    }, 0);
    const runningBalance = initialBalance + currentMonthFlow;

    return [
      `${day}/${month}/${year}`,
      t.description,
      (t.paymentMethod || '-').toUpperCase(),
      t.type === 'income' ? formatCurrency(t.amount) : '-',
      t.type === 'expense' ? formatCurrency(t.amount) : '-',
      formatCurrency(runningBalance)
    ];
  });

  // AutoTable
  autoTable(doc, {
    startY: 45,
    head: [['DATA', 'DESCRIÇÃO', 'MEIO', 'ENTRADAS', 'SAÍDAS', 'SALDO']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 48, 135], // #003087
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center'
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 28, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' }
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    }
  });

  // Footer - Resumo Financeiro
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lastAutoTable = (doc as any).lastAutoTable;
  const finalY = lastAutoTable ? lastAutoTable.finalY : 45;
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netTotal = totalIncome - totalExpense;
  const finalBalance = initialBalance + netTotal;

  // Resumo Box
  doc.setDrawColor(0, 48, 135);
  doc.setFillColor(245, 247, 250);
  doc.rect(14, finalY + 10, pageWidth - 28, 45, 'F');
  doc.rect(14, finalY + 10, pageWidth - 28, 45, 'S');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO DO PERÍODO', 20, finalY + 18);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Saldo Anterior:', 20, finalY + 26);
  doc.text(formatCurrency(initialBalance), pageWidth - 20, finalY + 26, { align: 'right' });

  doc.text('Total de Entradas:', 20, finalY + 32);
  doc.text(`+ ${formatCurrency(totalIncome)}`, pageWidth - 20, finalY + 32, { align: 'right' });
  
  doc.text('Total de Saídas:', 20, finalY + 38);
  doc.text(`- ${formatCurrency(totalExpense)}`, pageWidth - 20, finalY + 38, { align: 'right' });
  
  doc.setFont('helvetica', 'bold');
  doc.text('SALDO FINAL:', 20, finalY + 48);
  if (finalBalance >= 0) {
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setTextColor(239, 68, 68);
  }
  doc.text(formatCurrency(finalBalance), pageWidth - 20, finalY + 48, { align: 'right' });

  // Signature area
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(`Relatório gerado em ${new Date().toLocaleString('pt-BR')}`, 14, doc.internal.pageSize.getHeight() - 10);

  doc.save(`Relatorio_Contador_${monthYear.replace('/', '_')}.pdf`);
};

export const generateCashClosurePDF = (orders: Order[], transactions: Transaction[], date: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('65.453.393 DANIELA FREITAS DA SILVA', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('FECHAMENTO DE CAIXA DIÁRIO', pageWidth / 2, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`DATA: ${date}`, pageWidth / 2, 34, { align: 'center' });

  // Divider
  doc.setDrawColor(0, 48, 135);
  doc.line(14, 40, pageWidth - 14, 40);

  // Stats Summary
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netCash = totalIncome - totalExpense;

  autoTable(doc, {
    startY: 45,
    head: [['RESUMO DE VENDAS', 'VALOR']],
    body: [
      ['Total de Pedidos', totalOrders.toString()],
      ['Faturamento Bruto', formatCurrency(totalSales)],
      ['Ticket Médio', formatCurrency(totalOrders > 0 ? totalSales / totalOrders : 0)]
    ],
    theme: 'plain',
    headStyles: { fillColor: [0, 48, 135], textColor: [255, 255, 255] },
    styles: { fontSize: 10, cellPadding: 4 }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let finalY = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: finalY,
    head: [['FLUXO DE CAIXA', 'VALOR']],
    body: [
      ['Total de Entradas', formatCurrency(totalIncome)],
      ['Total de Saídas (Sangrias)', formatCurrency(totalExpense)],
      ['Saldo Final em Caixa', formatCurrency(netCash)]
    ],
    theme: 'plain',
    headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
    styles: { fontSize: 10, cellPadding: 4 }
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  finalY = (doc as any).lastAutoTable.finalY + 15;

  // Top Products Table
  const productSales: { [key: string]: { name: string, quantity: number, total: number } } = {};
  orders.forEach(o => {
    o.items.forEach(item => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = { name: item.name, quantity: 0, total: 0 };
      }
      productSales[item.productId].quantity += item.quantity;
      productSales[item.productId].total += item.price * item.quantity;
    });
  });

  const topProducts = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
    .map(p => [p.name, p.quantity.toString(), formatCurrency(p.total)]);

  doc.setFont('helvetica', 'bold');
  doc.text('PRODUTOS MAIS VENDIDOS', 14, finalY);

  autoTable(doc, {
    startY: finalY + 5,
    head: [['PRODUTO', 'QTD', 'TOTAL']],
    body: topProducts,
    theme: 'striped',
    headStyles: { fillColor: [100, 100, 100], textColor: [255, 255, 255] },
    styles: { fontSize: 9 }
  });

  doc.save(`Fechamento_Caixa_${date.replace(/\//g, '-')}.pdf`);
};
