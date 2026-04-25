/**
 * Data export utility functions.
 */

/**
 * Triggers a download of a CSV file.
 * @param {Array<Object>} data Array of objects to export.
 * @param {string} filename The name of the file to download.
 */
export const downloadCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) return;

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(obj => 
    Object.values(obj)
      .map(val => (typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val))
      .join(',')
  );
  
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
