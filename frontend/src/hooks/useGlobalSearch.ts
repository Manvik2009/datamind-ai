import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/lib/api';

interface SearchResult {
  type: string;
  items: Array<{
    id: string;
    title: string;
    subtitle?: string;
    href: string;
  }>;
}

export const useGlobalSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`);
        setResults(data || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (href: string) => {
    navigate(href);
    setIsOpen(false);
    setQuery('');
  };

  return {
    query,
    setQuery,
    results,
    isOpen,
    setIsOpen,
    loading,
    handleSelect,
  };
};
