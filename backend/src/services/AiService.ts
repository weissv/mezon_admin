// src/services/AiService.ts
import OpenAI from "openai";
import { PrismaClient } from "@prisma/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mammoth from "mammoth";

const prisma = new PrismaClient();

// Ленивая инициализация клиентов
let geminiClient: GoogleGenerativeAI | null = null;
let groqClient: OpenAI | null = null;

// Gemini API ключ для embeddings
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAVj3h-G3QU1mZpS1hdQloAYhuvQMe_B7k";

// Groq API ключ для chat
const GROQ_API_KEY = process.env.GROQ_API_KEY || "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";

// Google Drive folder ID для базы знаний
const GOOGLE_DRIVE_FOLDER_ID = "1d9_a3NQ2hHioMJsaUJ53NIj-CS1rVeDd";

function getGeminiClient(): GoogleGenerativeAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return geminiClient;
}

function getGroqClient(): OpenAI {
  if (!groqClient) {
    groqClient = new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return groqClient;
}

// Модель для embeddings (Gemini) - возвращает 768 размерность
const EMBEDDING_MODEL = "text-embedding-004";
// Модель для chat (Groq)
const CHAT_MODEL = "qwen/qwen3-32b";

// Дефолтный системный промт
const DEFAULT_SYSTEM_PROMPT = `# Роль
Ты - ассистент школьного учителя, задача которого улучшить свою учебную программу по принципу метапредметности. Ты работаешь на инновационную школу, которая разрабатывает различные подходы, в том числе системно интегрирует темы из разных учебных программ.
Твоя задача: при разработке учебной программы или темы занятий для заданного предмета связывать разрабатываемый тобой контент с темами других предметов из базы знаний школы. Так ученики смогут закрепить пройденные знания по другим предметам или подготовиться к получению новых знаний из смежных дисциплин.

# КРИТИЧЕСКИ ВАЖНО - Работа только с базой знаний
- Ты ОБЯЗАН использовать ТОЛЬКО информацию из предоставленного КОНТЕКСТА (база знаний школы)
- НИКОГДА не придумывай информацию, которой нет в контексте
- Если в контексте нет нужной информации, ЧЕСТНО скажи: "В базе знаний школы нет информации по этому вопросу"
- НЕ делай предположений о содержании учебных программ, если их нет в контексте
- Все метапредметные связи должны основываться ТОЛЬКО на реальных документах из базы знаний

# Инструкция
- Отвечай на русском языке
- Если ты разрабатываешь учебную программу для определенного предмета, то связывай ее наполнение только с темами предметов из базы знаний школы. Покажи эти связи пользователю
- Если ты разрабатываешь темы уроков и занятий и их наполнение, то связывай их только с темами предметов из базы знаний школы. Покажи эти связи пользователю
- Если ты разрабатываешь учебную программу или план занятий для нового предмета, то связывай их наполнение только с темами предметов из базы знаний школы. Покажи эти связи пользователю
- На пользовательское сообщение "/start" в ответ поприветствуй его и дай краткое описание своей миссии
- В ответе обязательно укажи блок метапредметных связей: каким образом предлагаемые тобой темы связаны с темами других дисциплин из базы знаний
- Если контекст пуст или не содержит релевантной информации, сообщи об этом пользователю и предложи добавить нужные документы в базу знаний`;

// Хранилище текущего системного промта (в реальном приложении лучше хранить в БД)
let currentSystemPrompt = DEFAULT_SYSTEM_PROMPT;

/**
 * Получает текущий системный промт
 */
function getSystemPrompt(): string {
  return currentSystemPrompt;
}

/**
 * Устанавливает новый системный промт
 */
function setSystemPrompt(prompt: string): void {
  currentSystemPrompt = prompt;
}

/**
 * Сбрасывает системный промт к дефолтному
 */
function resetSystemPrompt(): void {
  currentSystemPrompt = DEFAULT_SYSTEM_PROMPT;
}

interface DocumentMetadata {
  title?: string;
  subject?: string;
  grade?: string;
  tags?: string[];
  source?: string;
  googleDriveFileId?: string;
  lastSyncedAt?: string;
  chunkIndex?: number;
  totalChunks?: number;
  [key: string]: unknown;
}

interface KnowledgeDocument {
  id: number;
  content: string;
  metadata: DocumentMetadata | null;
  similarity?: number;
}

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

// Google Drive API Key (нужно включить Drive API в Google Console)
// Альтернатива: использовать Service Account
const GOOGLE_DRIVE_API_KEY = process.env.GOOGLE_DRIVE_API_KEY || "AIzaSyA6wzkCTfiyRxtfSQiF4Ctlnc_oodtQ9dQ";

/**
 * Получает список файлов из Google Drive папки (публичной)
 * Примечание: требуется включить Google Drive API в Google Console
 */
async function getGoogleDriveFiles(): Promise<GoogleDriveFile[]> {
  try {
    // Используем Google Drive API v3 для получения файлов из публичной папки
    const url = `https://www.googleapis.com/drive/v3/files?q='${GOOGLE_DRIVE_FOLDER_ID}'+in+parents&key=${GOOGLE_DRIVE_API_KEY}&fields=files(id,name,mimeType,webViewLink)`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      console.log("Google Drive API response:", errorText);
      
      // Если Drive API недоступен, пробуем альтернативный метод
      if (errorText.includes("accessNotConfigured") || errorText.includes("SERVICE_DISABLED")) {
        console.log("⚠️ Google Drive API не включен. Используйте ручную загрузку документов.");
        console.log("Для включения API перейдите: https://console.developers.google.com/apis/api/drive.googleapis.com/overview");
      }
      return [];
    }
    
    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error("Error fetching Google Drive files:", error);
    return [];
  }
}

// Поддерживаемые типы файлов для синхронизации
const SUPPORTED_MIME_TYPES = [
  "application/vnd.google-apps.document",  // Google Docs
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "text/plain",                             // .txt файлы
  "text/markdown",                          // .md файлы
];

/**
 * Проверяет, поддерживается ли тип файла для синхронизации
 */
function isSupportedFileType(mimeType: string, fileName: string): boolean {
  // Google Docs всегда поддерживаются
  if (mimeType === "application/vnd.google-apps.document") {
    return true;
  }
  // DOCX файлы
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return true;
  }
  // Текстовые файлы
  if (SUPPORTED_MIME_TYPES.includes(mimeType)) {
    return true;
  }
  // Проверяем расширение файла
  const supportedExtensions = [".txt", ".md", ".markdown", ".docx"];
  return supportedExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

/**
 * Очищает текст от нулевых байтов и невалидных UTF-8 символов
 */
function sanitizeText(text: string): string {
  // Удаляем нулевые байты
  let cleaned = text.replace(/\x00/g, "");
  // Удаляем другие управляющие символы кроме переносов строк и табуляции
  cleaned = cleaned.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return cleaned;
}

/**
 * Парсит DOCX файл и извлекает текст
 */
async function parseDocxContent(buffer: Buffer): Promise<string | null> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return sanitizeText(result.value);
  } catch (error) {
    console.error("Error parsing DOCX:", error);
    return null;
  }
}

/**
 * Получает содержимое текстового файла из Google Drive
 */
async function getGoogleDriveFileContent(fileId: string, mimeType: string): Promise<string | null> {
  try {
    // Для Google Docs используем export в текстовый формат
    if (mimeType === "application/vnd.google-apps.document") {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain&key=${GOOGLE_DRIVE_API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        const text = await response.text();
        return sanitizeText(text);
      }
    }
    
    // Для DOCX файлов скачиваем как бинарный и парсим через mammoth
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_DRIVE_API_KEY}`;
      const response = await fetch(url);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return await parseDocxContent(buffer);
      }
    }
    
    // Для текстовых файлов используем get с alt=media
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_DRIVE_API_KEY}`;
    const response = await fetch(url);
    if (response.ok) {
      const text = await response.text();
      return sanitizeText(text);
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching file ${fileId}:`, error);
    return null;
  }
}

/**
 * Добавляет документ напрямую из текста (для ручной загрузки)
 */
async function addDocumentFromText(
  text: string,
  title: string,
  subject?: string,
  grade?: string
): Promise<{ id: number; success: boolean; chunksCreated: number }> {
  try {
    const metadata: DocumentMetadata = {
      title,
      subject,
      grade,
      source: "Manual Upload",
      lastSyncedAt: new Date().toISOString(),
    };
    
    // Разбиваем большие документы на чанки
    const chunks = splitIntoChunks(text, 3000, 300);
    let firstId = 0;
    
    for (let i = 0; i < chunks.length; i++) {
      const chunkMetadata: DocumentMetadata = {
        ...metadata,
        chunkIndex: i,
        totalChunks: chunks.length,
        title: chunks.length > 1 ? `${title} (часть ${i + 1}/${chunks.length})` : title,
      };
      
      const result = await addDocument(chunks[i], chunkMetadata);
      if (i === 0) firstId = result.id;
    }
    
    return { id: firstId, success: true, chunksCreated: chunks.length };
  } catch (error) {
    console.error("Error adding document from text:", error);
    throw error;
  }
}

/**
 * Разбивает большой текст на чанки для лучшего поиска
 */
function splitIntoChunks(text: string, maxChunkSize: number = 2000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + maxChunkSize;
    
    // Пытаемся найти конец предложения или абзаца
    if (end < text.length) {
      const lastParagraph = text.lastIndexOf('\n\n', end);
      const lastSentence = text.lastIndexOf('. ', end);
      
      if (lastParagraph > start + maxChunkSize / 2) {
        end = lastParagraph + 2;
      } else if (lastSentence > start + maxChunkSize / 2) {
        end = lastSentence + 2;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }
  
  return chunks.filter(chunk => chunk.length > 50);
}

/**
 * Синхронизирует документы из Google Drive в локальную базу знаний
 * Поддерживает обновление существующих документов и разбиение на чанки
 */
async function syncGoogleDriveDocuments(): Promise<{ synced: number; updated: number; errors: number; skipped: number }> {
  let synced = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;
  
  try {
    const files = await getGoogleDriveFiles();
    console.log(`📂 Found ${files.length} files in Google Drive folder`);
    
    for (const file of files) {
      try {
        // Проверяем поддерживается ли тип файла
        if (!isSupportedFileType(file.mimeType, file.name)) {
          console.log(`⏭️ Skipping unsupported file type: ${file.name} (${file.mimeType})`);
          skipped++;
          continue;
        }
        
        // Получаем содержимое файла
        const content = await getGoogleDriveFileContent(file.id, file.mimeType);
        if (!content || content.trim().length < 10) {
          console.log(`⏭️ File ${file.name} has no content or is too short`);
          skipped++;
          continue;
        }
        
        // Проверяем, есть ли уже этот документ в базе
        const existing = await prisma.$queryRaw<{ id: number; content: string }[]>`
          SELECT id, content FROM "KnowledgeBaseDocument" 
          WHERE metadata->>'googleDriveFileId' = ${file.id}
          LIMIT 1
        `;
        
        // Если документ уже есть и содержимое не изменилось - пропускаем
        if (existing.length > 0) {
          const existingContent = existing[0].content;
          // Сравниваем хеш содержимого (первые 500 символов)
          if (existingContent.substring(0, 500) === content.substring(0, 500)) {
            continue; // Содержимое не изменилось
          }
          
          // Удаляем старые версии документа для обновления
          await prisma.$executeRaw`
            DELETE FROM "KnowledgeBaseDocument" 
            WHERE metadata->>'googleDriveFileId' = ${file.id}
          `;
          console.log(`🔄 Updating: ${file.name}`);
          updated++;
        }
        
        // Извлекаем метаданные из имени файла
        // Формат: "Предмет - Класс - Тема.txt" или просто название
        const nameParts = file.name.replace(/\.(txt|doc|docx|pdf|gdoc)$/i, "").split(" - ");
        const metadata: DocumentMetadata = {
          title: nameParts[nameParts.length - 1] || file.name,
          subject: nameParts.length > 1 ? nameParts[0] : undefined,
          grade: nameParts.length > 2 ? nameParts[1] : undefined,
          source: "Google Drive",
          googleDriveFileId: file.id,
          lastSyncedAt: new Date().toISOString(),
        };
        
        // Разбиваем большие документы на чанки
        const chunks = splitIntoChunks(content, 3000, 300);
        
        for (let i = 0; i < chunks.length; i++) {
          const chunkMetadata: DocumentMetadata = {
            ...metadata,
            chunkIndex: i,
            totalChunks: chunks.length,
            title: chunks.length > 1 ? `${metadata.title} (часть ${i + 1}/${chunks.length})` : metadata.title,
          };
          
          await addDocument(chunks[i], chunkMetadata);
        }
        
        if (existing.length === 0) {
          synced++;
          console.log(`✅ Synced: ${file.name} (${chunks.length} chunks)`);
        }
      } catch (fileError) {
        console.error(`❌ Error processing file ${file.name}:`, fileError);
        errors++;
      }
    }
  } catch (error) {
    console.error("❌ Error syncing Google Drive documents:", error);
  }
  
  return { synced, updated, errors, skipped };
}

/**
 * Генерирует эмбеддинг для текста через Gemini API
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const client = getGeminiClient();
    const model = client.getGenerativeModel({ model: EMBEDDING_MODEL });
    
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;
    
    // Gemini text-embedding-004 возвращает 768 размерность
    // Нам нужно привести к 1536 для совместимости с БД
    // Или можно изменить размерность в БД на 768
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw new Error("Не удалось сгенерировать эмбеддинг");
  }
}

/**
 * Добавляет документ в базу знаний с генерацией эмбеддинга
 */
async function addDocument(
  text: string,
  metadata: DocumentMetadata = {}
): Promise<{ id: number; success: boolean }> {
  try {
    // Генерируем эмбеддинг
    const embedding = await generateEmbedding(text);
    const embeddingString = `[${embedding.join(",")}]`;

    // Используем raw query для вставки вектора, т.к. Prisma плохо типизирует векторы
    const result = await prisma.$executeRaw`
      INSERT INTO "KnowledgeBaseDocument" (content, metadata, embedding, "createdAt", "updatedAt")
      VALUES (
        ${text},
        ${JSON.stringify(metadata)}::jsonb,
        ${embeddingString}::vector,
        NOW(),
        NOW()
      )
      RETURNING id
    `;

    // Получаем ID вставленной записи
    const inserted = await prisma.$queryRaw<{ id: number }[]>`
      SELECT id FROM "KnowledgeBaseDocument" ORDER BY id DESC LIMIT 1
    `;

    return { id: inserted[0].id, success: true };
  } catch (error) {
    console.error("Error adding document:", error);
    throw new Error("Не удалось добавить документ в базу знаний");
  }
}

/**
 * Поиск похожих документов по косинусному сходству
 */
async function findSimilarDocuments(
  queryEmbedding: number[],
  limit: number = 5
): Promise<KnowledgeDocument[]> {
  try {
    const embeddingString = `[${queryEmbedding.join(",")}]`;

    // Поиск с использованием оператора <=> для косинусного расстояния
    const results = await prisma.$queryRaw<KnowledgeDocument[]>`
      SELECT 
        id,
        content,
        metadata,
        1 - (embedding <=> ${embeddingString}::vector) as similarity
      FROM "KnowledgeBaseDocument"
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${embeddingString}::vector
      LIMIT ${limit}
    `;

    return results;
  } catch (error) {
    console.error("Error finding similar documents:", error);
    return [];
  }
}

/**
 * Формирует контекст из найденных документов
 */
function buildContext(documents: KnowledgeDocument[]): string {
  if (documents.length === 0) {
    return "Контекст из базы знаний не найден.";
  }

  return documents
    .map((doc, index) => {
      const meta = doc.metadata;
      const metaInfo = meta
        ? `[${meta.subject || "Без предмета"}${meta.grade ? `, ${meta.grade}` : ""}]`
        : "";
      return `--- Документ ${index + 1} ${metaInfo} ---\n${doc.content}`;
    })
    .join("\n\n");
}

/**
 * Основная функция чата с AI-ассистентом (RAG)
 */
async function chatWithAssistant(
  userQuery: string,
  conversationHistory: ChatMessage[] = []
): Promise<{ response: string; sources: KnowledgeDocument[] }> {
  try {
    // 1. Генерируем эмбеддинг для запроса пользователя
    const queryEmbedding = await generateEmbedding(userQuery);

    // 2. Поиск похожих документов в базе знаний
    const relevantDocs = await findSimilarDocuments(queryEmbedding, 5);

    // 3. Формируем контекст
    const context = buildContext(relevantDocs);

    // 4. Собираем сообщения для LLM
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: getSystemPrompt() },
      {
        role: "system",
        content: `КОНТЕКСТ из базы знаний учебных программ:\n\n${context}`,
      },
      // Добавляем историю разговора
      ...conversationHistory.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      { role: "user", content: userQuery },
    ];

    // 5. Отправляем запрос в LLM (Groq)
    const client = getGroqClient();
    const completion = await client.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content || "Не удалось получить ответ";

    return {
      response,
      sources: relevantDocs,
    };
  } catch (error) {
    console.error("Error in chatWithAssistant:", error);
    throw new Error("Ошибка при обработке запроса к AI-ассистенту");
  }
}

/**
 * Получает все документы из базы знаний (без эмбеддингов)
 */
async function getAllDocuments(): Promise<
  { id: number; content: string; metadata: DocumentMetadata | null; createdAt: Date }[]
> {
  try {
    const documents = await prisma.$queryRaw<
      { id: number; content: string; metadata: DocumentMetadata | null; createdAt: Date }[]
    >`
      SELECT id, content, metadata, "createdAt"
      FROM "KnowledgeBaseDocument"
      ORDER BY "createdAt" DESC
    `;
    return documents;
  } catch (error) {
    console.error("Error getting documents:", error);
    throw new Error("Не удалось получить документы");
  }
}

/**
 * Удаляет документ из базы знаний
 */
async function deleteDocument(id: number): Promise<boolean> {
  try {
    await prisma.$executeRaw`
      DELETE FROM "KnowledgeBaseDocument" WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    console.error("Error deleting document:", error);
    throw new Error("Не удалось удалить документ");
  }
}

export const AiService = {
  addDocument,
  addDocumentFromText,
  chatWithAssistant,
  getAllDocuments,
  deleteDocument,
  generateEmbedding,
  syncGoogleDriveDocuments,
  getGoogleDriveFiles,
  getSystemPrompt,
  setSystemPrompt,
  resetSystemPrompt,
};
