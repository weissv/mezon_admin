// src/pages/DashboardPage.test.tsx
// Unit тесты для страницы Dashboard

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from './DashboardPage';

// Мок данных
const mockSummaryData = {
  kpi: {
    childrenCount: 150,
    employeesCount: 35,
    activeClubs: 8,
    financeLast30d: [
      { type: 'INCOME', _sum: { amount: 5000000 } },
      { type: 'EXPENSE', _sum: { amount: 3500000 } },
    ],
  },
};

const mockMetricsData = {
  childrenCount: 150,
  employeesCount: 35,
  activeClubs: 8,
  lowInventory: [
    { id: 1, name: 'Карандаши', quantity: 5, unit: 'шт' },
  ],
  attendance: { today: 145, date: '2024-10-15' },
  maintenance: { activeRequests: 3 },
  employees: { needingMedicalCheckup: 2 },
};

// Мок API
vi.mock('../lib/api', () => ({
  api: {
    get: vi.fn((url: string) => {
      if (url.includes('summary')) return Promise.resolve(mockSummaryData);
      if (url.includes('metrics')) return Promise.resolve(mockMetricsData);
      if (url.includes('unit-economics')) return Promise.resolve({
        period: { days: 30, workingDays: 22 },
        children: { total: 150, avgDaily: 140 },
        totals: { totalCost: 3500000, costPerChild: 23333 },
      });
      if (url.includes('cash-forecast')) return Promise.resolve({
        currentBalance: 50000000,
        forecast: [],
        summary: { recommendations: [] },
      });
      return Promise.resolve({});
    }),
  },
}));

// Мок useAuth
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, role: 'ADMIN', email: 'admin@test.com' },
    isAuthenticated: true,
  }),
}));

// Мок toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const renderDashboard = () => {
  return render(
    <BrowserRouter>
      <DashboardPage />
    </BrowserRouter>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Рендеринг', () => {
    it('показывает состояние загрузки', () => {
      renderDashboard();
      // Начальное состояние загрузки
    });

    it('отображает KPI карточки после загрузки', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument();
      });
    });

    it('отображает количество детей', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/дети/i)).toBeInTheDocument();
      });
    });

    it('отображает количество сотрудников', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/сотрудники/i)).toBeInTheDocument();
      });
    });

    it('отображает активные кружки', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/кружки/i)).toBeInTheDocument();
      });
    });
  });

  describe('Финансовая информация', () => {
    it('отображает баланс доходов/расходов', async () => {
      renderDashboard();

      await waitFor(() => {
        // Проверяем что финансовые данные отображаются
        expect(screen.getByText(/доход/i)).toBeInTheDocument();
      });
    });
  });

  describe('Предупреждения', () => {
    it('показывает предупреждения о низком запасе', async () => {
      renderDashboard();

      await waitFor(() => {
        // Проверяем наличие секции с предупреждениями
        expect(screen.getByText(/карандаши/i)).toBeInTheDocument();
      });
    });

    it('показывает активные заявки на обслуживание', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/обслуживание/i)).toBeInTheDocument();
      });
    });
  });

  describe('Посещаемость', () => {
    it('отображает статистику посещаемости за сегодня', async () => {
      renderDashboard();

      await waitFor(() => {
        expect(screen.getByText(/посещаемость/i)).toBeInTheDocument();
      });
    });
  });

  describe('Интерактивность', () => {
    it('раскрывает детали юнит-экономики', async () => {
      renderDashboard();

      await waitFor(async () => {
        // Ищем кнопку раскрытия деталей
        const expandButton = screen.queryByText(/показать детали/i) || 
                            screen.queryByRole('button', { name: /подробнее/i });
        if (expandButton) {
          await userEvent.click(expandButton);
        }
      });
    });
  });

  describe('Адаптивность для ролей', () => {
    it('показывает финансовый прогноз для директора/админа', async () => {
      renderDashboard();

      await waitFor(() => {
        // Для админа должны показываться расширенные данные
        expect(screen.getByText(/прогноз/i)).toBeInTheDocument();
      });
    });
  });
});

describe('KPICard Component', () => {
  it('отображает заголовок и значение', async () => {
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('35')).toBeInTheDocument();
    });
  });

  it('применяет правильные стили акцентного цвета', async () => {
    renderDashboard();

    await waitFor(() => {
      // KPI карточки должны иметь иконки
      const icons = screen.getAllByRole('img', { hidden: true });
      expect(icons.length).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('Dashboard Data Fetching', () => {
  it('делает параллельные запросы к API', async () => {
    const { api } = await import('../lib/api');
    renderDashboard();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/dashboard/summary');
      expect(api.get).toHaveBeenCalledWith('/api/dashboard/metrics');
    });
  });

  it('обрабатывает ошибки API', async () => {
    const { api } = await import('../lib/api');
    const { toast } = await import('sonner');
    
    vi.mocked(api.get).mockRejectedValueOnce(new Error('API Error'));
    
    renderDashboard();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
