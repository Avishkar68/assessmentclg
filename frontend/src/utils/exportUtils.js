/**
 * Reusable client-side export utility helpers
 */

/**
 * Export data to a downloadable CSV file
 * @param {Array<string>} headers - Header column names
 * @param {Array<Array<any>>} rows - Matrix of grid cells
 * @param {string} filename - Target filename
 */
export const exportToCSV = (headers, rows, filename = 'export.csv') => {
  const escapeCSV = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map(r => r.map(escapeCSV).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export data to a downloadable Excel Spreadsheet (.xls formatted template)
 * @param {Array<string>} headers - Header column names
 * @param {Array<Array<any>>} rows - Matrix of grid cells
 * @param {string} filename - Target filename
 */
export const exportToExcel = (headers, rows, filename = 'export.xls') => {
  const template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Results Report</x:Name>
              <x:WorksheetOptions>
                <x:DisplayGridlines/>
              </x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta charset="utf-8">
      <style>
        table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
        th { background-color: #4f46e5; color: white; font-weight: bold; border: 1px solid #d1d5db; padding: 10px; text-align: left; }
        td { border: 1px solid #e5e7eb; padding: 8px; font-size: 13px; color: #1f2937; }
        tr:nth-child(even) { background-color: #f9fafb; }
      </style>
    </head>
    <body>
      <h2>Assessment Performance Ledger</h2>
      <p>Report Generated: ${new Date().toLocaleString()}</p>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.map(r => `<tr>${r.map(val => `<td>${val !== undefined && val !== null ? val : ''}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([template], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xls') ? filename : `${filename}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
