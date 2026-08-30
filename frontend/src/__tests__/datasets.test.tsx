import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { DatasetUpload } from '@/components/DatasetUpload';
import { DatasetList } from '@/components/DatasetList';
import { DatasetRecord } from '@/types/dataset';

describe('DatasetUpload', () => {
  it('should render upload area', () => {
    const onUploaded = () => {};
    const { container } = render(<DatasetUpload onUploaded={onUploaded} />);
    expect(container.querySelector('label')).toBeDefined();
  });
});

describe('DatasetList', () => {
  it('should render empty state when no datasets', () => {
    const { container } = render(<DatasetList datasets={[]} onSelect={() => {}} />);
    expect(container.textContent).toContain('No datasets uploaded yet');
  });

  it('should render datasets', () => {
    const datasets: DatasetRecord[] = [
      {
        id: '1',
        filename: 'test.csv',
        original_filename: 'test.csv',
        row_count: 100,
        column_count: 5,
        status: 'ready',
        uploaded_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ];
    const { container } = render(<DatasetList datasets={datasets} onSelect={() => {}} />);
    expect(container.textContent).toContain('test.csv');
  });
});
