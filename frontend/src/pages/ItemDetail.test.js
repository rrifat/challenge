import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ItemDetail from './ItemDetail';

function renderItemDetails(path = '/items/1') {
  return render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/" element={<p>Items home</p>} />
        <Route path="/items/:id" element={<ItemDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ItemDetail', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('renders item details after a successful fetch', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        name: 'Desk Chair',
        category: 'Furniture',
        price: 129,
      }),
    });

    renderItemDetails();

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    expect(await screen.findByRole('heading', { name: 'Desk Chair' })).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === 'Category: Furniture')).toBeInTheDocument();
    expect(screen.getByText((_, element) => element?.textContent === 'Price: $129')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/items/1');
  });

  it('redirects back to the list when the fetch fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    });

    renderItemDetails('/items/999');

    await waitFor(() => {
      expect(screen.getByText('Items home')).toBeInTheDocument();
    });
  });
});
