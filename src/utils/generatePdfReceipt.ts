import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '@/types';

export const buildOrderPdfDoc = (order: Order): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const primaryEmerald: [number, number, number] = [4, 120, 87]; // Emerald #047857
  const darkSlate: [number, number, number] = [15, 23, 42]; // Slate 900
  const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50
  const borderGray: [number, number, number] = [226, 232, 240]; // Slate 200

  // 1. Top Header Banner
  doc.setFillColor(...primaryEmerald);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RUSHABH AGENCY', 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Authorised FMCG Distributor & Stockist • Field SFA Order Indent', 14, 17);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.text('Reckitt • Dabur • Everest • Maxo • ITC • Parachute • Sensodyne • Kinder Joy • Godrej', 14, 22);

  // Top Right Order Slip Badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(148, 5, 48, 16, 2, 2, 'F');
  doc.setTextColor(...primaryEmerald);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER SLIP NO:', 151, 10);
  doc.setFontSize(11);
  doc.text(order.orderNumber, 151, 16);

  // 2. Info Cards (Dukan Details & Order Details)
  const infoY = 32;
  const colW = 89;

  // Left Card: Dukan Details
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, infoY, colW, 28, 2, 2, 'FD');

  doc.setTextColor(...primaryEmerald);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('RETAILER / DUKAN DETAILS', 18, infoY + 5.5);

  doc.setTextColor(...darkSlate);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Shop: ${order.dukanName}`, 18, infoY + 11, { maxWidth: 82 });
  doc.text(`Proprietor: ${order.ownerName}`, 18, infoY + 16);
  doc.text(`Contact: ${order.phone}`, 18, infoY + 21);
  doc.text(`Beat / Route: ${order.tripName}`, 18, infoY + 25.5);

  // Right Card: Salesman & Booking Info
  const rightX = 14 + colW + 4;
  doc.setFillColor(...lightBg);
  doc.roundedRect(rightX, infoY, colW, 28, 2, 2, 'FD');

  doc.setTextColor(...primaryEmerald);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('BOOKING & SALESMAN INFO', rightX + 4, infoY + 5.5);

  doc.setTextColor(...darkSlate);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Salesman: ${order.salesmanName}`, rightX + 4, infoY + 11);
  doc.text(`Booking Date: ${new Date(order.createdAt).toLocaleDateString('en-IN')}`, rightX + 4, infoY + 16);
  doc.text(`Booking Time: ${new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, rightX + 4, infoY + 21);
  doc.text(`Order Status: BOOKED IN FIELD`, rightX + 4, infoY + 25.5);

  // 3. Items Table (Exact 182mm width)
  const tableRows = order.items.map((item, index) => [
    (index + 1).toString(),
    item.wdmsCode,
    item.companyName,
    `${item.productName} (${item.packSize})`,
    `${item.unitsPerBox} pcs`,
    item.boxQty > 0 ? `${item.boxQty} Box` : '-',
    item.looseQty > 0 ? `${item.looseQty} Pcs` : '-',
    `${item.totalUnits} Pcs`,
    `Rs. ${item.mrp.toFixed(2)}`,
    `Rs. ${item.lineMrpTotal.toFixed(2)}`,
  ]);

  const tableFoot = [[
    '',
    'TOTAL',
    '',
    `${order.items.length} SKUs Ordered`,
    '',
    `${order.totalBoxes} Boxes`,
    `${order.totalLoose} Pcs`,
    `${order.totalUnits} Units`,
    '',
    `Rs. ${order.totalMrpValue.toFixed(2)}`,
  ]];

  autoTable(doc, {
    startY: 64,
    head: [[
      'Sr.',
      'WDMS Code',
      'Company',
      'Product & Pack Size',
      'Box Pack',
      'Boxes (Peti)',
      'Loose',
      'Total Pcs',
      'MRP',
      'MRP Total',
    ]],
    body: tableRows,
    foot: tableFoot,
    theme: 'grid',
    headStyles: {
      fillColor: primaryEmerald,
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      valign: 'middle',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    footStyles: {
      fillColor: [236, 253, 245], // Emerald 50
      textColor: [6, 95, 70], // Emerald 800
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'left', cellWidth: 20 },
      3: { halign: 'left', cellWidth: 46 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
      6: { halign: 'center', cellWidth: 12 },
      7: { halign: 'center', cellWidth: 14, fontStyle: 'bold' },
      8: { halign: 'right', cellWidth: 16 },
      9: { halign: 'right', cellWidth: 18, fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  // @ts-ignore
  const finalY = doc.lastAutoTable?.finalY || 180;

  // Check if summary fits on current page
  let currentY = finalY + 6;
  if (currentY + 55 > 280) {
    doc.addPage();
    currentY = 16;
  }

  // 4. Notes & Order Summary Matrix
  // Left Notes Box
  doc.setFillColor(...lightBg);
  doc.setDrawColor(...borderGray);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, currentY, 94, 30, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkSlate);
  doc.text('SALESMAN NOTES & DISPATCH TERMS:', 18, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const noteText = order.notes ? `Note: "${order.notes}"` : 'Note: Standard field order booked by salesman.';
  doc.text(noteText, 18, currentY + 10, { maxWidth: 86 });
  doc.text(
    'Final tax invoice with wholesale billing rates, distributor trade schemes, and GST will be issued in WDMS upon physical dispatch from Rushabh Agency godown.',
    18,
    currentY + 17,
    { maxWidth: 86 }
  );

  // Right Totals Box
  const summaryBoxX = 112;
  const summaryBoxW = 84;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(summaryBoxX, currentY, summaryBoxW, 30, 2, 2, 'FD');

  doc.setTextColor(...primaryEmerald);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ORDER SUMMARY TOTAL', summaryBoxX + 4, currentY + 5.5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkSlate);
  doc.text('Total Boxes (Peti):', summaryBoxX + 4, currentY + 11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${order.totalBoxes} Boxes`, summaryBoxX + summaryBoxW - 4, currentY + 11, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Total Loose Pieces:', summaryBoxX + 4, currentY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(`${order.totalLoose} Pcs`, summaryBoxX + summaryBoxW - 4, currentY + 16, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.text('Total Order Pieces:', summaryBoxX + 4, currentY + 21);
  doc.setFont('helvetica', 'bold');
  doc.text(`${order.totalUnits} Units`, summaryBoxX + summaryBoxW - 4, currentY + 21, { align: 'right' });

  // Divider Line & Estimated Total MRP
  doc.setDrawColor(167, 243, 208);
  doc.line(summaryBoxX + 4, currentY + 23, summaryBoxX + summaryBoxW - 4, currentY + 23);

  doc.setTextColor(...primaryEmerald);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATED MRP TOTAL:', summaryBoxX + 4, currentY + 28);
  doc.setFontSize(9);
  doc.text(
    `Rs. ${order.totalMrpValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    summaryBoxX + summaryBoxW - 4,
    currentY + 28,
    { align: 'right' }
  );

  // 5. Signatures Block
  let sigY = currentY + 44;
  if (sigY + 15 > 285) {
    doc.addPage();
    sigY = 24;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);

  // Retailer Stamp
  doc.line(24, sigY, 74, sigY);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('Dukandar / Retailer Stamp & Sign', 49, sigY + 4, { align: 'center' });

  // Salesman Signature
  doc.line(136, sigY, 186, sigY);
  doc.text('Hiren Shah (Sales Officer)', 161, sigY + 4, { align: 'center' });
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  return doc;
};

export const generateOrderPdf = (order: Order): void => {
  const doc = buildOrderPdfDoc(order);
  doc.save(`${order.orderNumber}_${order.dukanName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
};

export const getOrderPdfBlobUrl = (order: Order): string => {
  const doc = buildOrderPdfDoc(order);
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};

export const viewOrderPdf = (order: Order): void => {
  try {
    const url = getOrderPdfBlobUrl(order);
    const win = window.open(url, '_blank');
    if (!win) {
      // Fallback if popup blocked
      window.location.href = url;
    }
  } catch (err) {
    console.error('Error viewing PDF', err);
    generateOrderPdf(order);
  }
};

export const generateWhatsAppShareLink = (order: Order, agencyPhone: string = '918128232377'): string => {
  let text = `📋 *RUSHABH AGENCY - FIELD ORDER BOOKED: ${order.orderNumber}*\n`;
  text += `🏬 *Dukan:* ${order.dukanName}\n`;
  text += `👤 *Proprietor:* ${order.ownerName} (${order.phone})\n`;
  text += `📍 *Trip/Route:* ${order.tripName}\n`;
  text += `🚴 *Salesman:* ${order.salesmanName}\n`;
  text += `📅 *Date:* ${new Date(order.createdAt).toLocaleDateString('en-IN')}\n\n`;
  text += `📦 *ITEMS INDENTED (BOX + LOOSE):*\n`;

  order.items.forEach((item, idx) => {
    const boxText = item.boxQty > 0 ? `${item.boxQty} Box ` : '';
    const looseText = item.looseQty > 0 ? `${item.looseQty} Loose ` : '';
    text += `${idx + 1}. [${item.wdmsCode}] *${item.productName}* (${item.packSize})\n`;
    text += `   👉 ${boxText}${looseText}= *${item.totalUnits} Pcs* @ MRP Rs. ${item.mrp} = Rs. ${item.lineMrpTotal.toFixed(2)}\n`;
  });

  text += `\n📊 *TOTAL:* ${order.totalBoxes} Boxes | ${order.totalLoose} Loose | *${order.totalUnits} Total Pcs*\n`;
  text += `💰 *Est. MRP Total:* Rs. ${order.totalMrpValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}\n`;
  if (order.notes) text += `📝 *Note:* ${order.notes}\n`;

  return `https://wa.me/${agencyPhone}?text=${encodeURIComponent(text)}`;
};

/**
 * Shares the actual official PDF file directly to WhatsApp on mobile (Android/iOS)
 * using the Web Share API with files.
 * On desktop PC browsers, it downloads the PDF file to downloads and opens WhatsApp
 * chat with the Owner (8128232377) so the PDF can be attached.
 */
export const shareOrderPdfViaWhatsApp = async (
  order: Order,
  agencyPhone: string = '918128232377'
): Promise<void> => {
  const cleanDukanName = order.dukanName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `${order.orderNumber}_${cleanDukanName}.pdf`;

  try {
    const doc = buildOrderPdfDoc(order);
    const pdfBlob = doc.output('blob');
    const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

    // Native mobile file sharing (Android Chrome, iOS Safari, PWA)
    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      navigator.canShare &&
      navigator.canShare({ files: [pdfFile] })
    ) {
      await navigator.share({
        title: `Order PDF Slip - ${order.orderNumber}`,
        text: `📄 Rushabh Agency Order Slip: ${order.orderNumber} for ${order.dukanName} (${order.totalUnits} Pcs)`,
        files: [pdfFile],
      });
      return;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // User cancelled share dialog
      return;
    }
    console.warn('Native PDF file share not supported or failed, falling back:', err);
  }

  // Desktop / Browser Fallback:
  // 1. Download the PDF file directly to the device
  generateOrderPdf(order);

  // 2. Open WhatsApp chat with pre-filled message
  const fallbackMsg = `📄 *RUSHABH AGENCY - OFFICIAL ORDER PDF SLIP*\n` +
    `*Order No:* ${order.orderNumber}\n` +
    `🏬 *Dukan:* ${order.dukanName} (${order.tripName})\n` +
    `👤 *Proprietor:* ${order.ownerName}\n` +
    `📦 *Order Volume:* ${order.totalBoxes} Boxes + ${order.totalLoose} Loose = *${order.totalUnits} Pcs*\n` +
    `💰 *Est. MRP Total:* Rs. ${order.totalMrpValue.toFixed(2)}\n\n` +
    `📎 *Official PDF File:* "${fileName}" has been downloaded to your device.\n` +
    `👉 Please tap the paperclip / attachment (+) icon to send the PDF here.`;

  window.open(`https://wa.me/${agencyPhone}?text=${encodeURIComponent(fallbackMsg)}`, '_blank');
};
