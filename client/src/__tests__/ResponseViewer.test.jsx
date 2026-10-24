import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ResponseViewer } from '../features/request-builder/ResponseViewer';

describe('ResponseViewer Component', () => {
  it('should render empty placeholder when no response is provided', () => {
    render(<ResponseViewer response={null} loading={false} />);
    expect(screen.getByText(/No Response Yet/i)).toBeInTheDocument();
  });

  it('should render loading indicator when executing', () => {
    render(<ResponseViewer response={null} loading={true} />);
    expect(screen.getByText(/Executing request/i)).toBeInTheDocument();
  });

  it('should render response status code, latency, and assertions summary', () => {
    const mockResponse = {
      statusCode: 200,
      statusText: 'OK',
      durationMs: 42,
      responseSize: 1024,
      headers: { 'content-type': 'application/json' },
      body: { success: true },
      rawBody: '{"success":true}',
    };

    const mockAssertions = [
      { assertionType: 'STATUS_CODE_EQUALS', passed: true, message: 'Status code equals 200' },
    ];

    render(<ResponseViewer response={mockResponse} assertions={mockAssertions} loading={false} />);

    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('42 ms')).toBeInTheDocument();
    expect(screen.getByText(/1\/1 Passed/i)).toBeInTheDocument();
  });
});
