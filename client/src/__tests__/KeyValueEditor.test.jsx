import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KeyValueEditor } from '../components/common/KeyValueEditor';

describe('KeyValueEditor Component', () => {
  it('should render empty state message when no pairs provided', () => {
    render(<KeyValueEditor pairs={[]} onChange={() => {}} />);
    expect(screen.getByText(/No parameters defined/i)).toBeInTheDocument();
  });

  it('should render existing key value pairs', () => {
    const pairs = [
      { key: 'Accept', value: 'application/json', enabled: true },
      { key: 'User-Agent', value: 'APIForge/1.0', enabled: false },
    ];
    render(<KeyValueEditor pairs={pairs} onChange={() => {}} />);

    expect(screen.getByDisplayValue('Accept')).toBeInTheDocument();
    expect(screen.getByDisplayValue('application/json')).toBeInTheDocument();
    expect(screen.getByDisplayValue('User-Agent')).toBeInTheDocument();
  });

  it('should trigger onChange when adding a new row', () => {
    const handleChange = vi.fn();
    render(<KeyValueEditor pairs={[]} onChange={handleChange} />);

    const addButton = screen.getByRole('button', { name: /Add Row/i });
    fireEvent.click(addButton);

    expect(handleChange).toHaveBeenCalledWith([
      { key: '', value: '', enabled: true },
    ]);
  });
});
