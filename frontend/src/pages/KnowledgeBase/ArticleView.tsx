// src/pages/KnowledgeBase/ArticleView.tsx
// Просмотр отдельной статьи с рендерингом Markdown и сайдбаром «Похожие статьи»

import { useState, useEffect} from"react";
import { useParams, useNavigate, Link} from"react-router-dom";
import { toast} from"sonner";
import {
 ArrowLeft,
 BookOpen,
 Edit,
 Trash2,
 Clock,
 User,
 Tag,
 Sparkles,
 Save,
 X,
} from"lucide-react";
import { knowledgeBaseApi} from"../../lib/api";
import { useAuth} from"../../hooks/useAuth";
import type { KnowledgeBaseArticle, UpdateArticleInput} from"../../types/knowledge-base";
import { Button} from"../../components/ui/button";
import { Input } from "../../components/ui/input";
import { LoadingCard } from "../../components/ui/LoadingState";
import { PageHeader, PageStack } from "../../components/ui/page";

// ============================================================================
// Простой рендерер Markdown (без внешних зависимостей)
// Поддерживает: заголовки, жирный, курсив, код, списки, ссылки, цитаты
// Для полноценного Markdown рекомендуется установить react-markdown
// ============================================================================
function renderMarkdown(md: string): string {
 const html = md
 // Блоки кода
 .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto my-4 text-sm"><code>$2</code></pre>')
 // Инлайн-код
 .replace(/`([^`]+)`/g, '<code class="bg-fill-tertiary text-macos-red px-1.5 py-0.5 rounded text-sm">$1</code>')
 // Заголовки
 .replace(/^### (.+)$/gm, '<h3 class="text-[14px] font-semibold tracking-[-0.01em] mt-6 mb-2">$1</h3>')
 .replace(/^## (.+)$/gm, '<h2 class="text-[24px] font-bold tracking-[-0.025em] leading-tight mt-8 mb-3">$1</h2>')
 .replace(/^# (.+)$/gm, '<h1 class="text-[24px] font-bold tracking-[-0.025em] leading-tight mt-8 mb-4">$1</h1>')
 // Жирный + курсив
 .replace(/\*\*\*(.+?)\*\*\*/g,"<strong><em>$1</em></strong>")
 .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>")
 .replace(/\*(.+?)\*/g,"<em>$1</em>")
 // Цитаты
 .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-blue-400 pl-4 py-1 my-3 text-secondary italic">$1</blockquote>')
 // Горизонтальная линия
 .replace(/^---$/gm, '<hr class="my-6 border-[rgba(0,0,0,0.08)]"/>')
 // Ссылки
 .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2"target="_blank"rel="noopener"class="text-macos-blue hover:underline">$1</a>')
 // Маркированные списки
 .replace(/^[-*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
 // Нумерованные списки
 .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
 // Абзацы
 .replace(/\n\n/g, '</p><p class="mb-3">')
 // Переносы строк
 .replace(/\n/g,"<br/>");

 return `<p class="mb-3">${html}</p>`;
}

export default function ArticleView() {
 const { slug} = useParams<{ slug: string}>();
 const navigate = useNavigate();
 const { user} = useAuth();

 const [article, setArticle] = useState<KnowledgeBaseArticle | null>(null);
 const [related, setRelated] = useState<KnowledgeBaseArticle[]>([]);
 const [loading, setLoading] = useState(true);

 // Редактирование
 const [isEditing, setIsEditing] = useState(false);
 const [editForm, setEditForm] = useState<UpdateArticleInput>({});
 const [saving, setSaving] = useState(false);
 const [editTagInput, setEditTagInput] = useState("");

 const canEdit = user && ["ADMIN","DEPUTY","DIRECTOR","DEVELOPER"].includes(user.role);

 // ========== Загрузка статьи и похожих ==========
 useEffect(() => {
 if (!slug) return;

 const load = async () => {
 setLoading(true);
 try {
 const data = await knowledgeBaseApi.getBySlug(slug);
 setArticle(data);

 // Загрузить похожие статьи
 try {
 const rel = await knowledgeBaseApi.getRelated(data.id, 5);
 setRelated(rel);
} catch {
 // Не критично
}
} catch (err) {
 console.error("Ошибка загрузки статьи:", err);
 toast.error("Статья не найдена");
 navigate("/knowledge-base");
} finally {
 setLoading(false);
}
};
 load();
}, [slug, navigate]);

 // ========== Редактирование ==========
 const startEditing = () => {
 if (!article) return;
 setEditForm({
 title: article.title,
 content: article.content,
 tags: [...article.tags],
 roles: [...article.roles],
});
 setIsEditing(true);
};

 const cancelEditing = () => {
 setIsEditing(false);
 setEditForm({});
 setEditTagInput("");
};

 const handleSave = async () => {
 if (!article) return;
 setSaving(true);
 try {
 const updated = await knowledgeBaseApi.update(article.id, editForm);
 setArticle(updated);
 setIsEditing(false);
 toast.success("Статья обновлена");
} catch (err) {
 toast.error("Не удалось сохранить изменения");
} finally {
 setSaving(false);
}
};

 const handleDelete = async () => {
 if (!article || !confirm("Удалить статью? Это действие необратимо.")) return;
 try {
 await knowledgeBaseApi.delete(article.id);
 toast.success("Статья удалена");
 navigate("/knowledge-base");
} catch {
 toast.error("Не удалось удалить статью");
}
};

 const addEditTag = () => {
 const tag = editTagInput.trim().toLowerCase();
 if (tag && !editForm.tags?.includes(tag)) {
 setEditForm((p) => ({ ...p, tags: [...(p.tags || []), tag]}));
 setEditTagInput("");
}
};

 const removeEditTag = (tag: string) => {
 setEditForm((p) => ({ ...p, tags: (p.tags || []).filter((t) => t !== tag)}));
};

 // ========== Рендер ==========
  if (loading) {
  return (
  <LoadingCard message="Загружаем статью..." height={220} />
  );
}

 if (!article) return null;

 return (
  <PageStack>
  <PageHeader
  eyebrow="Knowledge base · статья"
  title={article.title}
  description={!isEditing && article.author ? `${article.author.employee.firstName} ${article.author.employee.lastName}` : "Просмотр и редактирование статьи базы знаний"}
  icon={<BookOpen className="h-5 w-5"/>}
  meta={<span className="mezon-badge macos-badge-neutral">{new Date(article.updatedAt).toLocaleDateString("ru-RU")}</span>}
  actions={<div className="flex gap-2">
  <Button variant="ghost"size="sm"onClick={() => navigate("/knowledge-base")}><ArrowLeft className="mr-1 h-4 w-4"/> Назад</Button>
  {canEdit && !isEditing && <><Button variant="outline"size="sm"onClick={startEditing}><Edit className="mr-1 h-4 w-4"/> Редактировать</Button><Button variant="outline"size="sm"onClick={handleDelete} className="text-macos-red hover:text-macos-red"><Trash2 className="mr-1 h-4 w-4"/> Удалить</Button></>}
  {isEditing && <><Button variant="outline"size="sm"onClick={cancelEditing}><X className="mr-1 h-4 w-4"/> Отмена</Button><Button size="sm"onClick={handleSave} disabled={saving}><Save className="mr-1 h-4 w-4"/> {saving ?"Сохранение...":"Сохранить"}</Button></>}
  </div>}
  />

  <div className="flex flex-col lg:flex-row gap-6">
 {/* ===== Основной контент ===== */}
 <div className="flex-1 min-w-0">
  <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-6 lg:p-8">
  {isEditing ? (
  <div className="space-y-4">
 <div>
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Заголовок</label>
  <Input
  type="text"
  value={editForm.title ||""}
  onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value}))}
  className="w-full text-[14px] font-semibold tracking-[-0.01em]"
  />
 </div>

 <div>
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Содержимое (Markdown)</label>
 <textarea
 value={editForm.content ||""}
 onChange={(e) => setEditForm((p) => ({ ...p, content: e.target.value}))}
 rows={20}
 className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
 />
 </div>

 <div>
 <label className="block text-[11px] font-medium uppercase tracking-widest mb-1">Теги</label>
 <div className="flex gap-2">
  <Input
  type="text"
  value={editTagInput}
  onChange={(e) => setEditTagInput(e.target.value)}
  onKeyDown={(e) => e.key ==="Enter"&& (e.preventDefault(), addEditTag())}
  className="flex-1"
  placeholder="Введите тег"
  />
 <Button variant="outline"onClick={addEditTag} type="button">
 +
 </Button>
 </div>
 {(editForm.tags?.length ?? 0) > 0 && (
 <div className="flex flex-wrap gap-1 mt-2">
  {editForm.tags!.map((tag) => (
 <span
 key={tag}
 className="px-2 py-1 bg-tint-blue text-macos-blue text-xs rounded-full flex items-center gap-1"
 >
 {tag}
 <button onClick={() => removeEditTag(tag)} className="hover:text-macos-red">×</button>
   </span>
   ))}
   </div>
   )}
    </div>
    </div>
   ) : (
  <>
 <h1 className="text-3xl font-bold mb-4">{article.title}</h1>

 {/* Мета-информация */}
 <div className="flex flex-wrap items-center gap-4 text-sm text-secondary mb-6 pb-4 border-b border-[rgba(0,0,0,0.04)]">
 {article.author && (
 <span className="flex items-center gap-1">
 <User className="h-4 w-4"/>
 {article.author.employee.firstName} {article.author.employee.lastName}
 </span>
 )}
 <span className="flex items-center gap-1">
 <Clock className="h-4 w-4"/>
 {new Date(article.updatedAt).toLocaleDateString("ru-RU", {
 day:"numeric",
 month:"long",
 year:"numeric",
})}
 </span>
 </div>

 {/* Теги */}
 {article.tags.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-6">
 {article.tags.map((tag) => (
 <Link
 key={tag}
 to={`/knowledge-base?tags=${tag}`}
 className="px-3 py-1 bg-tint-blue text-macos-blue text-sm rounded-full hover:bg-[rgba(0,122,255,0.12)] macos-transition flex items-center gap-1"
 >
 <Tag className="h-3 w-3"/>
 {tag}
 </Link>
 ))}
 </div>
 )}

 {/* Контент (Markdown) */}
 <article
 className="prose prose-gray max-w-none leading-relaxed"
  dangerouslySetInnerHTML={{ __html: renderMarkdown(article.content)}}
  />
  </>
  )}
  </div>
  </div>

 {/* ===== Сайдбар: Похожие статьи ===== */}
 {!isEditing && related.length > 0 && (
 <aside className="lg:w-80 flex-shrink-0">
   <div className="bg-white rounded-xl border border-[rgba(0,0,0,0.08)] p-5 sticky top-6">
 <h3 className="font-semibold text-sm text-primary mb-4 flex items-center gap-2">
 <Sparkles className="h-4 w-4 text-blue-500"/>
 Похожие статьи
 </h3>

 <div className="space-y-3">
 {related.map((rel) => (
 <Link
 key={rel.id}
 to={`/knowledge-base/${rel.slug}`}
 className="block p-3 rounded-lg hover:bg-fill-quaternary macos-transition border border-transparent hover:border-[rgba(0,0,0,0.08)]"
 >
 <h4 className="font-medium text-sm mb-1 line-clamp-2">{rel.title}</h4>
 <p className="text-xs text-secondary line-clamp-2">{rel.summary}</p>
 {rel.similarity !== undefined && rel.similarity !== null && (
 <span className="text-xs text-blue-500 mt-1 inline-block">
 {(rel.similarity * 100).toFixed(0)}% сходство
 </span>
 )}
 </Link>
 ))}
 </div>
   </div>
  </aside>
  )}
  </div>
  </PageStack>
  );
}
