import type { Sale } from "../types/sale";

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const printReceipt = (sale: Sale, branchName?: string): void => {
  const printWindow = window.open("", "_blank", "width=380,height=600");
  if (!printWindow) return; // popup blocked — nothing more we can do here

  const itemsHtml = sale.items
    .map(
      (item) => `
        <tr>
          <td style="padding:3px 0;">${escapeHtml(item.name)}</td>
          <td style="padding:3px 0;text-align:center;">${item.quantity}</td>
          <td style="padding:3px 0;text-align:right;">${item.price.toLocaleString()}</td>
          <td style="padding:3px 0;text-align:right;">${(item.price * item.quantity).toLocaleString()}</td>
        </tr>`,
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(sale.saleNumber)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    width: 300px;
    margin: 0 auto;
    padding: 16px 12px;
    color: #111;
    font-size: 12px;
  }
  h1 { font-size: 15px; text-align: center; margin: 0 0 2px; }
  .center { text-align: center; }
  .muted { color: #555; font-size: 11px; }
  hr { border: none; border-top: 1px dashed #999; margin: 8px 0; }
  table { width: 100%; border-collapse: collapse; }
  thead td { font-weight: bold; border-bottom: 1px solid #333; font-size: 11px; }
  .totals td { padding: 2px 0; }
  .totals .label { color: #333; }
  .grand { font-size: 14px; font-weight: bold; }
  @media print { body { width: auto; } }
</style>
</head>
<body>
  <h1>${escapeHtml(branchName || "Receipt")}</h1>
  <p class="center muted">${escapeHtml(sale.saleNumber)}</p>
  <p class="center muted">${new Date(sale.createdAt).toLocaleString()}</p>
  <hr />
  <table>
    <thead>
      <tr>
        <td>Item</td>
        <td style="text-align:center;">Qty</td>
        <td style="text-align:right;">Price</td>
        <td style="text-align:right;">Total</td>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <hr />
  <table class="totals">
    <tr><td class="label">Subtotal</td><td style="text-align:right;">${sale.subtotal.toLocaleString()} Ks</td></tr>
    ${
      sale.discountAmount > 0
        ? `<tr><td class="label">Discount${sale.discountType === "percent" ? ` (${sale.discountValue}%)` : ""}</td><td style="text-align:right;">-${sale.discountAmount.toLocaleString()} Ks</td></tr>`
        : ""
    }
    ${
      sale.taxAmount > 0
        ? `<tr><td class="label">Tax (${sale.taxRate}%)</td><td style="text-align:right;">+${sale.taxAmount.toLocaleString()} Ks</td></tr>`
        : ""
    }
    ${
      sale.couponDiscountAmount && sale.couponDiscountAmount > 0
        ? `<tr><td class="label">Coupon${sale.couponCode ? ` (${escapeHtml(sale.couponCode)})` : ""}</td><td style="text-align:right;">-${sale.couponDiscountAmount.toLocaleString()} Ks</td></tr>`
        : ""
    }
    <tr class="grand"><td>Total</td><td style="text-align:right;">${sale.totalAmount.toLocaleString()} Ks</td></tr>
  </table>
  <hr />
  <p class="muted">Payment: ${escapeHtml(sale.paymentMethod.replace("_", " "))}</p>
  <p class="muted">Cashier: ${escapeHtml(sale.cashierName)}</p>
  ${
    sale.approvedByName
      ? `<p class="muted">Approved by: ${escapeHtml(sale.approvedByName)}</p>`
      : ""
  }
  ${
    sale.linkedReturnNumber
      ? `<p class="muted">Exchange for: ${escapeHtml(sale.linkedReturnNumber)}</p>`
      : ""
  }
  <p class="center muted" style="margin-top:16px;">Thank you!</p>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  // give the new window a beat to render before invoking the print dialog
  setTimeout(() => {
    printWindow.print();
  }, 250);
};