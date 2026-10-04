import api from '../services/api';
import { toast } from 'react-hot-toast';

/**
 * Downloads a file/document from the API endpoint and handles blob creation & triggering browser download.
 * @param {string} endpoint - API path to download (e.g. '/documents/download/bill/123')
 * @param {string} fallbackFilename - Default filename if disposition header is absent
 */
export const downloadDocument = async (endpoint, fallbackFilename = 'document.pdf') => {
  try {
    const response = await api.get(endpoint, { responseType: 'blob' });
    let filename = fallbackFilename;

    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    } else {
      const contentType = response.headers['content-type'];
      if (contentType) {
        if (contentType.includes('image/jpeg')) filename = fallbackFilename.replace(/\.pdf$/, '.jpg');
        else if (contentType.includes('image/png')) filename = fallbackFilename.replace(/\.pdf$/, '.png');
      }
    }

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Failed to download document');
    return false;
  }
};
