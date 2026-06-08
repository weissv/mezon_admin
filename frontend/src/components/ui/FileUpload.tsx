import { useState, useRef } from 'react';
import { UploadCloud, X, File, Loader2 } from 'lucide-react';
import { Button } from './button';
import { api } from '../../lib/api';
import { toast } from 'sonner';

interface FileUploadProps {
  label?: string;
  value?: string; // Existing file URL
  onChange: (fileUrl: string, fileName: string) => void;
  accept?: string;
}

export function FileUpload({ label, value, onChange, accept = ".pdf,.doc,.docx,.jpg,.png" }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.upload('/api/upload', file);
      onChange(response.fileUrl, file.name);
      toast.success('Файл успешно загружен');
    } catch (error) {
      console.error(error);
      toast.error('Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearFile = () => {
    onChange('', '');
  };

  return (
    <div className="flex flex-col gap-2">
      {label && <label className="mezon-form-label">{label}</label>}
      {value ? (
        <div className="flex items-center justify-between rounded-xl border border-[rgba(15,23,42,0.08)] bg-[rgba(255,255,255,0.8)] p-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-tint-blue text-macos-blue">
              <File className="h-5 w-5" />
            </div>
            <div className="truncate text-[13px] font-medium text-primary">
              <a href={`${import.meta.env.VITE_API_URL || ''}${value}`} target="_blank" rel="noreferrer" className="hover:underline">
                Прикрепленный файл
              </a>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={clearFile} className="h-8 w-8 p-0 text-macos-red hover:text-macos-red">
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[rgba(15,23,42,0.1)] bg-[rgba(255,255,255,0.5)] py-6 px-4 transition-colors hover:border-macos-blue hover:bg-[rgba(255,255,255,0.8)] ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
        >
          {isUploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-macos-blue" />
          ) : (
            <UploadCloud className="h-6 w-6 text-macos-blue" />
          )}
          <div className="text-center">
            <p className="text-[13px] font-medium text-primary">
              {isUploading ? 'Загрузка...' : 'Нажмите, чтобы загрузить файл'}
            </p>
            <p className="mt-1 text-[11px] text-secondary">
              PDF, DOC, DOCX, JPG, PNG до 10MB
            </p>
          </div>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={accept}
        onChange={handleFileSelect}
      />
    </div>
  );
}
