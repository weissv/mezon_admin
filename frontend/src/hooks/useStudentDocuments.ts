// src/hooks/useStudentDocuments.ts
import { useState, useCallback, useEffect, useMemo } from 'react';
import { api } from '../lib/api';
import {
  Document,
  StudentDocumentCategory,
  AttachStudentDocumentInput,
  UpdateStudentDocumentInput,
} from '../types/document';
import { toast } from 'sonner';

export type CategoryFilter = StudentDocumentCategory | 'ALL';

export function useStudentDocuments(
  childId: number | null,
  initialDocuments?: Document[]
) {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments || []);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync if initialDocuments is provided or updated
  useEffect(() => {
    if (initialDocuments && initialDocuments.length > 0) {
      setDocuments(initialDocuments);
    }
  }, [initialDocuments]);

  const fetchDocuments = useCallback(async () => {
    if (!childId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.get<any>(`/api/children/${childId}/documents`);
      let list: Document[] = [];
      if (Array.isArray(res)) {
        list = res;
      } else if (res && Array.isArray(res.documents)) {
        list = res.documents;
      } else if (res && Array.isArray(res.items)) {
        list = res.items;
      }
      setDocuments(list);
    } catch (err: any) {
      console.error('Failed to fetch student documents:', err);
      toast.error('Ошибка загрузки документов ученика', {
        description: err?.message || 'Не удалось получить список документов',
      });
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const attachDocument = useCallback(
    async (input: AttachStudentDocumentInput): Promise<Document | null> => {
      if (!childId) return null;
      try {
        const created = await api.post<Document>(`/api/children/${childId}/documents`, input);
        toast.success('Документ успешно прикреплен');
        if (created) {
          setDocuments((prev) => [created, ...prev.filter((d) => d.id !== created.id)]);
        }
        await fetchDocuments();
        return created;
      } catch (err: any) {
        console.error('Failed to attach document:', err);
        toast.error('Ошибка прикрепления документа', {
          description: err?.message || 'Пожалуйста, проверьте данные',
        });
        throw err;
      }
    },
    [childId, fetchDocuments]
  );

  const updateDocument = useCallback(
    async (documentId: number, input: UpdateStudentDocumentInput): Promise<Document | null> => {
      if (!childId) return null;
      try {
        const updated = await api.put<Document>(`/api/children/${childId}/documents/${documentId}`, input);
        toast.success('Документ обновлен');
        if (updated) {
          setDocuments((prev) => prev.map((d) => (d.id === documentId ? updated : d)));
        }
        await fetchDocuments();
        return updated;
      } catch (err: any) {
        console.error('Failed to update document:', err);
        toast.error('Ошибка обновления документа', {
          description: err?.message || 'Пожалуйста, проверьте данные',
        });
        throw err;
      }
    },
    [childId, fetchDocuments]
  );

  const deleteDocument = useCallback(
    async (documentId: number): Promise<boolean> => {
      if (!childId) return false;
      try {
        await api.delete(`/api/children/${childId}/documents/${documentId}`);
        toast.success('Документ удален');
        setDocuments((prev) => prev.filter((d) => d.id !== documentId));
        await fetchDocuments();
        return true;
      } catch (err: any) {
        console.error('Failed to delete document:', err);
        toast.error('Ошибка удаления документа', {
          description: err?.message || 'Не удалось удалить документ',
        });
        return false;
      }
    },
    [childId, fetchDocuments]
  );

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<CategoryFilter, number> = {
      ALL: documents.length,
      DIPLOMA: 0,
      QUESTIONNAIRE: 0,
      EXPLANATORY: 0,
      MEDICAL: 0,
      IDENTITY: 0,
      CONTRACT: 0,
      APPLICATION: 0,
      OTHER: 0,
    };

    for (const doc of documents) {
      const cat = (doc.category as StudentDocumentCategory) || 'OTHER';
      if (counts[cat] !== undefined) {
        counts[cat]++;
      } else {
        counts.OTHER++;
      }
    }

    return counts;
  }, [documents]);

  // Client-side filtering for zero-latency interactions
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Category filter
      if (selectedCategory !== 'ALL') {
        const docCat = doc.category || 'OTHER';
        if (docCat !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = doc.name.toLowerCase().includes(query);
        const matchesDesc = doc.description?.toLowerCase().includes(query) || false;
        return matchesName || matchesDesc;
      }

      return true;
    });
  }, [documents, selectedCategory, searchQuery]);

  return {
    documents: filteredDocuments,
    allDocuments: documents,
    loading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    categoryCounts,
    attachDocument,
    updateDocument,
    deleteDocument,
    refresh: fetchDocuments,
  };
}
