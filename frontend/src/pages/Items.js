import { useEffect, useRef, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { List } from 'react-window';

const ITEM_HEIGHT = 64;
const MAX_VISIBLE_ITEMS = 8;
const LIMIT = 100

function Row({ ariaAttributes, index, items, style }) {
  const item = items[index];

  return (
    <li
      {...ariaAttributes}
      style={{ ...style, boxSizing: 'border-box', paddingBottom: 8 }}
    >
      <div
        style={{
          height: ITEM_HEIGHT - 8,
          boxSizing: 'border-box',
          border: '1px solid #ddd',
          borderRadius: 8,
          padding: 12,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Link to={'/items/' + item.id}>{item.name}</Link>
      </div>
    </li>
  );
}

function Items() {
  const {
    items,
    total,
    totalPages,
    loading,
    error,
    fetchItems,
  } = useData();
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchItems({ signal: controller.signal, page, limit: LIMIT, q: query }).catch(console.error);

    return () => {
      controller.abort();
    };
  }, [fetchItems, page, query]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollToRow({ index: 0, align: 'start' });
    }
  }, [page, query]);

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

  const listHeight = Math.min(Math.max(items.length, 1), MAX_VISIBLE_ITEMS) * ITEM_HEIGHT;

  return (
    <section style={{ padding: 16, display: 'grid', gap: 16 }}>
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'grid',
          gap: 10,
          width: 'min(100%, 42rem)'
        }}
      >
        <label htmlFor="item-search" style={{ fontWeight: 600 }}>
          Search items
        </label>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) auto',
            gap: 8,
            alignItems: 'center',
            width: '100%'
          }}
        >
          <input
            id="item-search"
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by name or category"
            style={{ minWidth: 0, width: '100%', padding: '10px 12px' }}
          />
          <button type="submit" style={{ padding: '10px 16px' }}>Search</button>
        </div>
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
        <div aria-label="Items results" style={{ minWidth: 0 }}>
          <List
            listRef={listRef}
            overscanCount={3}
            rowComponent={Row}
            rowCount={items.length}
            rowHeight={ITEM_HEIGHT}
            rowProps={{ items }}
            style={{ height: listHeight, width: '100%', margin: 0, padding: 0, listStyle: 'none' }}
            tagName="ul"
          />
        </div>
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
