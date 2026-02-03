// src/components/Modal.test.tsx
// Unit тесты для Modal компонента

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from './Modal';

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    title: 'Test Modal',
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Рендеринг', () => {
    it('не рендерит ничего когда isOpen=false', () => {
      const { container } = render(
        <Modal {...defaultProps} isOpen={false}>
          Content
        </Modal>
      );

      expect(container.firstChild).toBeNull();
    });

    it('рендерит модальное окно когда isOpen=true', () => {
      render(<Modal {...defaultProps} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Modal content')).toBeInTheDocument();
    });

    it('отображает заголовок', () => {
      render(<Modal {...defaultProps} title="Custom Title" />);

      expect(screen.getByRole('heading')).toHaveTextContent('Custom Title');
    });

    it('отображает children', () => {
      render(
        <Modal {...defaultProps}>
          <p>Child paragraph</p>
          <button>Child button</button>
        </Modal>
      );

      expect(screen.getByText('Child paragraph')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /child button/i })).toBeInTheDocument();
    });
  });

  describe('Закрытие', () => {
    it('вызывает onClose при клике на кнопку закрытия', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('кнопка закрытия имеет aria-label', () => {
      render(<Modal {...defaultProps} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      expect(closeButton).toHaveAttribute('aria-label', 'Close');
    });
  });

  describe('Стили', () => {
    it('имеет overlay с backdrop', () => {
      const { container } = render(<Modal {...defaultProps} />);

      const overlay = container.firstChild;
      expect(overlay).toHaveClass('fixed');
      expect(overlay).toHaveClass('inset-0');
      expect(overlay).toHaveClass('z-50');
    });

    it('контент центрирован', () => {
      const { container } = render(<Modal {...defaultProps} />);

      const overlay = container.firstChild;
      expect(overlay).toHaveClass('flex');
      expect(overlay).toHaveClass('items-center');
      expect(overlay).toHaveClass('justify-center');
    });

    it('контент имеет ограниченную ширину', () => {
      render(<Modal {...defaultProps} />);

      const content = screen.getByText('Modal content').closest('div.w-full');
      expect(content).toHaveClass('max-w-lg');
    });

    it('контент имеет скролл при переполнении', () => {
      render(<Modal {...defaultProps} />);

      const content = screen.getByText('Modal content').closest('.overflow-y-auto');
      expect(content).toBeInTheDocument();
    });
  });

  describe('Доступность', () => {
    it('имеет правильную структуру заголовка', () => {
      render(<Modal {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Test Modal');
    });

    it('кнопка закрытия доступна для keyboard navigation', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(<Modal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: /close/i });
      closeButton.focus();
      await user.keyboard('{Enter}');

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Поведение с разным контентом', () => {
    it('рендерит форму внутри модалки', () => {
      render(
        <Modal {...defaultProps}>
          <form data-testid="modal-form">
            <input type="text" name="test" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      );

      expect(screen.getByTestId('modal-form')).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    });

    it('рендерит длинный контент', () => {
      const longContent = Array(20)
        .fill(null)
        .map((_, i) => <p key={i}>Paragraph {i + 1}</p>);

      render(<Modal {...defaultProps}>{longContent}</Modal>);

      expect(screen.getByText('Paragraph 1')).toBeInTheDocument();
      expect(screen.getByText('Paragraph 20')).toBeInTheDocument();
    });
  });

  describe('Состояния', () => {
    it('переключается между открытым и закрытым состоянием', () => {
      const { rerender } = render(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();

      rerender(<Modal {...defaultProps} isOpen={true} />);

      expect(screen.getByText('Test Modal')).toBeInTheDocument();

      rerender(<Modal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });
  });
});
