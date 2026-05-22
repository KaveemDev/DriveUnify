import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export const useSearch = () => {
  const { files, searchQuery, sortBy, sortDir, selectedAccount } = useSelector(s => s.drive);

  const filteredFiles = useMemo(() => {
    let result = [...files];

    // Filter by selected account
    if (selectedAccount) {
      result = result.filter(f => f.accountEmail === selectedAccount);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.accountEmail.toLowerCase().includes(q) ||
        f.category?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let valA, valB;

      switch (sortBy) {
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'modifiedTime':
          valA = new Date(a.modifiedTime || 0).getTime();
          valB = new Date(b.modifiedTime || 0).getTime();
          break;
        case 'size':
          valA = a.size || 0;
          valB = b.size || 0;
          break;
        case 'mimeType':
          valA = a.mimeType || '';
          valB = b.mimeType || '';
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    // Always show folders first
    result.sort((a, b) => {
      const aIsFolder = a.mimeType === 'application/vnd.google-apps.folder';
      const bIsFolder = b.mimeType === 'application/vnd.google-apps.folder';
      if (aIsFolder && !bIsFolder) return -1;
      if (!aIsFolder && bIsFolder) return 1;
      return 0;
    });

    return result;
  }, [files, searchQuery, sortBy, sortDir, selectedAccount]);

  return { filteredFiles, totalCount: files.length, filteredCount: filteredFiles.length };
};
