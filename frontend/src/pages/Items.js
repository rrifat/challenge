import { useEffect, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';

function Items() {
  const {
    items,
    limit,
    total,
    totalPages,
    loading,
    error,
    fetchItems,
  } = useData();
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    fetchItems({ signal: controller.signal, page, limit, q: query }).catch(console.error);

    return () => {
      controller.abort();
    };
  }, [fetchItems, limit, page, query]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setQuery(searchInput.trim());
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  return (
    <section style={{ padding: 16, display: 'grid', gap: 16 }}>
      <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <label htmlFor="item-search" style={{ fontWeight: 600 }}>
          Search items
        </label>
        <input
          id="item-search"
          type="search"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder="Search by name or category"
          style={{ minWidth: 240, padding: '8px 12px' }}
        />
        <button type="submit">Search</button>
      </form>

      <div aria-live="polite">
        {loading ? (
          <p>Loading items...</p>
        ) : (
          <p>
            Showing {items.length} of {total} items
            {query ? ` for "${query}"` : ''}.
          </p>
        )}
        {error ? <p role="alert">Unable to load items. {error}</p> : null}
      </div>

      {!loading && !items.length ? (
        <p>No items matched your search.</p>
      ) : (
        <ul style={{ display: 'grid', gap: 8, padding: 0, listStyle: 'none' }}>
          {items.map(item => (
            <li key={item.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12 }}>
              <Link to={'/items/' + item.id}>{item.name}</Link>
            </li>
          ))}
        </ul>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button type="button" onClick={handlePreviousPage} disabled={page <= 1 || loading}>
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button type="button" onClick={handleNextPage} disabled={page >= totalPages || loading}>
          Next
        </button>
      </div>
    </section>
  );
}

export default Items;