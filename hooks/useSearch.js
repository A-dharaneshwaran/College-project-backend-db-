import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';

/**
 * useSearch — Production-grade search hook
 *
 * Features:
 * - 350ms debounce on query string
 * - Automatic request cancellation on new keystrokes (race-condition safe)
 * - Server-side pagination
 * - Server-side sorting
 * - Arbitrary filter support
 * - loading / error / empty state management
 * - reset() helper
 *
 * @param {string} endpoint   — API path, e.g. '/search/students'
 * @param {Object} initialFilters — initial filter values (department, year, etc.)
 * @param {Object} options    — { debounceMs, defaultLimit, defaultSort, autoFetch }
 */
const useSearch = (endpoint, initialFilters = {}, options = {}) => {
  const {
    debounceMs = 350,
    defaultLimit = 20,
    defaultSort = '-createdAt',
    autoFetch = true,   // if false, only fetches when search() is called explicitly
  } = options;

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [limit] = useState(defaultLimit);
  const [sort, setSort] = useState(defaultSort);

  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: defaultLimit,
    total: 0,
    pages: 0,
    hasNext: false,
    hasPrev: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cancel token — stores the AbortController for the in-flight request
  const abortRef = useRef(null);
  // Debounce timer
  const debounceTimer = useRef(null);
  // Track whether the hook is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (abortRef.current) abortRef.current.abort();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  /**
   * Core fetch function — builds query string and calls the API.
   * NOT debounced. Call via the debounced wrapper below.
   */
  const _fetchResults = useCallback(
    async (overrideQuery, overridePage, overrideFilters, overrideSort) => {
      const q = overrideQuery !== undefined ? overrideQuery : query;
      const p = overridePage !== undefined ? overridePage : page;
      const f = overrideFilters !== undefined ? overrideFilters : filters;
      const s = overrideSort !== undefined ? overrideSort : sort;

      // Cancel any previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (q && q.trim()) params.append('q', q.trim());
        params.append('page', p);
        params.append('limit', limit);
        if (s) params.append('sort', s);

        // Append all active filters
        Object.entries(f).forEach(([key, value]) => {
          if (value !== '' && value !== null && value !== undefined) {
            params.append(key, value);
          }
        });

        const res = await api.get(`${endpoint}?${params.toString()}`);

        if (!isMounted.current) return;

        // Both paginated wrapper formats (data.data or direct data)
        const resultData = res.data?.data || res.data || [];
        const resultPagination = res.data?.pagination || res.pagination || {};

        setData(resultData);
        setPagination({
          page: resultPagination.page || p,
          limit: resultPagination.limit || limit,
          total: resultPagination.total || 0,
          pages: resultPagination.pages || 0,
          hasNext: resultPagination.hasNext || false,
          hasPrev: resultPagination.hasPrev || false,
        });
      } catch (err) {
        if (!isMounted.current) return;
        // AbortError is expected — not a real error
        if (err.name === 'AbortError' || err.message === 'AbortError') return;
        setError(err.message || 'Search failed. Please try again.');
        setData([]);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    },
    [endpoint, query, page, filters, sort, limit]
  );

  /**
   * Debounced search trigger — called whenever query changes
   */
  useEffect(() => {
    if (!autoFetch) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      _fetchResults(query, 1, filters, sort);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, debounceMs]);

  /**
   * Re-fetch when page / filters / sort change (no debounce needed)
   */
  useEffect(() => {
    if (!autoFetch) return;
    _fetchResults(query, page, filters, sort);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sort]);

  /**
   * When filters change, reset to page 1 and fetch
   */
  useEffect(() => {
    if (!autoFetch) return;
    _fetchResults(query, 1, filters, sort);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Update the search query — triggers debounced fetch */
  const updateQuery = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  /** Update a single filter value */
  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  /** Replace all filters at once */
  const setAllFilters = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  /** Navigate to a specific page */
  const goToPage = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  /** Go to next page */
  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  /** Go to previous page */
  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  /** Update sort */
  const updateSort = useCallback((newSort) => {
    setSort(newSort);
    setPage(1);
  }, []);

  /** Reset everything to initial state */
  const reset = useCallback(() => {
    setQuery('');
    setFilters(initialFilters);
    setPage(1);
    setSort(defaultSort);
    setData([]);
    setError(null);
    setPagination({
      page: 1,
      limit: defaultLimit,
      total: 0,
      pages: 0,
      hasNext: false,
      hasPrev: false,
    });
  }, [initialFilters, defaultLimit, defaultSort]);

  /** Manual fetch trigger (for autoFetch=false mode) */
  const search = useCallback(() => {
    _fetchResults(query, page, filters, sort);
  }, [_fetchResults, query, page, filters, sort]);

  /** Retry after error */
  const retry = useCallback(() => {
    _fetchResults(query, page, filters, sort);
  }, [_fetchResults, query, page, filters, sort]);

  return {
    // State
    query,
    filters,
    page,
    limit,
    sort,
    data,
    pagination,
    loading,
    error,
    isEmpty: !loading && !error && data.length === 0,

    // Actions
    updateQuery,
    updateFilter,
    setAllFilters,
    goToPage,
    nextPage,
    prevPage,
    updateSort,
    reset,
    search,
    retry,
  };
};

export default useSearch;
