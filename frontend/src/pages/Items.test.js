import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Items from './Items';
import { useData } from '../state/DataContext';

jest.mock('../state/DataContext', () => ({
  useData: jest.fn(),
}));

jest.mock('react-window', () => ({
  List: ({ rowComponent: Row, rowCount, rowProps, tagName: Tag = 'div' }) => (
    <Tag data-testid="virtual-list">
      {Array.from({ length: rowCount }, (_, index) => (
        <Row
          key={index}
          index={index}
          style={{}}
          ariaAttributes={{}}
          {...rowProps}
        />
      ))}
    </Tag>
  ),
}));

function renderItems() {
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Items />
    </MemoryRouter>
  );
}

describe('Items', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading and error states from the data layer', () => {
    useData.mockReturnValue({
      items: [],
      total: 0,
      totalPages: 1,
      loading: true,
      error: 'Network failed',
      fetchItems: jest.fn().mockResolvedValue(undefined),
    });

    renderItems();

    expect(screen.getByText('Loading items...')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to load items. Network failed');
  });

  it('fetches on mount, submits trimmed search text, and paginates forward', async () => {
    const user = userEvent.setup();
    const fetchItems = jest.fn().mockResolvedValue(undefined);

    useData.mockReturnValue({
      items: [
        { id: 1, name: 'Notebook' },
        { id: 2, name: 'Lamp' },
      ],
      total: 12,
      totalPages: 3,
      loading: false,
      error: null,
      fetchItems,
    });

    renderItems();

    expect(fetchItems).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 100,
        q: '',
        signal: expect.anything(),
      })
    );

    await user.type(screen.getByLabelText(/search items/i), '  notebook  ');
    await user.click(screen.getByRole('button', { name: /search/i }));

    await waitFor(() => {
      expect(fetchItems).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 100,
          q: 'notebook',
          signal: expect.anything(),
        })
      );
    });

    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(fetchItems).toHaveBeenLastCalledWith(
        expect.objectContaining({
          page: 2,
          limit: 100,
          q: 'notebook',
          signal: expect.anything(),
        })
      );
    });
  });
});
