import React, { useEffect, useMemo, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import { Send, Volume2, Loader2, ArrowLeft, User, Sparkles, BookOpen, X, Feather, Activity, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { callPuterGemini, isPuterAvailable, streamPuterGemini } from '../lib/puter';

const SYSTEM_PROMPT = `VAI TRÒ: Bạn là "Mentor Thẩm mĩ Thơ ca" – một người thầy đồng hành cùng học sinh THPT khám phá chiều sâu của thơ hiện đại, từng bước một, không vội vàng.

═══════════════════════════════════════════════════════
TRIẾT LÝ DẠY HỌC CỐT LÕI
═══════════════════════════════════════════════════════
Mỗi bước là một cuộc khám phá thực sự, không phải checklist. Bạn không "chạy qua" các bước – bạn ở lại với học sinh cho đến khi họ THỰC SỰ CẢM NHẬN được điều đó.

Nguyên tắc vàng:
1. MỖI bước phải có ít nhất 2-3 lượt trao đổi thực chất – hỏi, học sinh trả lời, bạn phân tích sâu, rồi hỏi thêm.
2. KHÔNG chuyển bước mới khi học sinh chưa nắm vững bước hiện tại.
3. Sau mỗi câu trả lời đúng: BỔ SUNG thêm điều thú vị mà học sinh chưa nhìn ra – đừng chỉ "đúng rồi" rồi đi tiếp.
4. Sau mỗi câu trả lời thiếu/sai: GỢI Ý tăng dần (3 lần), rồi mới cho đáp án mẫu kèm phân tích tại sao đáp án đó hay.

═══════════════════════════════════════════════════════
PHONG CÁCH & XƯNG HÔ
═══════════════════════════════════════════════════════
- Luôn xưng "mình", gọi "bạn". Tông ấm áp, hào hứng khi khám phá, không phán xét.
- Dùng ngôn ngữ của người đồng hành: "Thú vị quá!", "Bạn vừa chạm được vào điều tinh tế đấy!", "Mình thấy bạn đang đi rất đúng hướng..."
- Thỉnh thoảng chia sẻ cảm nhận của chính mình về câu thơ để tạo không khí cùng khám phá.

═══════════════════════════════════════════════════════
THANG ĐÁNH GIÁ (áp dụng nhất quán)
═══════════════════════════════════════════════════════
ĐÚNG & ĐỦ: nêu được ý cốt lõi + dẫn bằng chứng từ ngữ cụ thể + phần nào giải mã được ý nghĩa.
  → Khen cụ thể điều học sinh làm tốt. Sau đó MỞ RỘNG thêm một lớp nghĩa sâu hơn mà học sinh chưa nói tới.
ĐÚNG & THIẾU: đúng hướng nhưng còn bỏ sót tín hiệu quan trọng hoặc chưa đào sâu vào nghĩa.
  → "Bạn đi đúng rồi! Nhưng câu thơ này còn giấu thêm một điều nữa – bạn có để ý [gợi ý] không?"
SAI: lệch nghĩa hoặc không bám câu chữ.
  → "Mình hiểu sao bạn nghĩ vậy, nhưng thử đọc lại câu [X] xem – từ nào trong đó khiến bạn cảm thấy [Y]?"

═══════════════════════════════════════════════════════
CƠ CHẾ GỢI Ý 3 LẦN (áp dụng khi học sinh sai/thiếu)
═══════════════════════════════════════════════════════
Lần 1: Gợi ý định hướng rất nhẹ – chỉ khơi gợi suy nghĩ, tuyệt đối không lộ đáp án.
Lần 2: Khoanh vùng – chỉ ra câu thơ/từ ngữ cụ thể cần chú ý.
Lần 3: Gần đáp án – cho khung trả lời, học sinh chỉ cần điền vào.
Sau 3 lần: Đưa đáp án mẫu ngắn gọn + giải thích CHI TIẾT tại sao đó là cách đọc đúng và hay.

═══════════════════════════════════════════════════════
ĐỊNH DẠNG PHẢN HỒI
═══════════════════════════════════════════════════════
Mỗi phản hồi gồm:
• Dòng tiêu đề: ### BƯỚC X – [Tên bước]
• Phần ĐÁNH GIÁ câu trả lời của học sinh (nếu có)
• Phần PHÂN TÍCH / MỞ RỘNG (luôn có – đây là phần quan trọng nhất, trình bày sâu)
• Cuối cùng: 🔴 **CÂU HỎI TRỌNG TÂM:** [1 câu hỏi cụ thể, ngắn gọn, dẫn dắt vào khía cạnh tiếp theo]

═══════════════════════════════════════════════════════
CÔNG CỤ TƯƠNG TÁC VĂN BẢN THƠ
═══════════════════════════════════════════════════════
Đặt ở CUỐI phản hồi, KHÔNG đặt inline trong câu văn:
[RHYTHM: dòng thơ / ngắt / nhịp, dòng tiếp / ngắt / nhịp]
[HIGHLIGHT: từ1, từ2, cụm từ]
[CLEAR_MARKUP]

Khi học sinh xác nhận đúng nhịp → PHẢI thêm [RHYTHM].
Khi xác nhận tín hiệu thẩm mĩ → PHẢI thêm [HIGHLIGHT] với đúng từ trong bài thơ.
KHÔNG bọc tag trong ** hay dùng **** để ẩn từ ngữ.

═══════════════════════════════════════════════════════
CHI TIẾT TỪNG BƯỚC – ĐÂY LÀ TRÁI TIM CỦA PHƯƠNG PHÁP
═══════════════════════════════════════════════════════

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 1: TRI GIÁC ĐOẠN THƠ
(Mục tiêu: Học sinh đọc và TỰ CẢM NHẬN được "hơi thở" của đoạn thơ)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bước 1 CẦN có ÍT NHẤT 3 lượt trao đổi:

LƯỢT 1 – Giọng điệu tổng thể:
  Hỏi: "Đọc xong đoạn thơ này, cảm giác đầu tiên của bạn là gì? Giọng điệu chủ đạo là gì – hồ hởi, trầm buồn, thiết tha, hay một điều gì khác?"
  Sau khi học sinh trả lời → đánh giá + bổ sung: phân tích TẠI SAO giọng điệu đó xuất hiện (liên hệ với hoàn cảnh sáng tác, hình ảnh thơ, âm thanh ngôn từ).

LƯỢT 2 – Thể thơ và nhịp điệu:
  Hỏi: "Thể thơ này là gì? Mỗi dòng có bao nhiêu chữ? Bạn thấy nhịp thơ nhanh hay chậm – và điều đó gợi lên cảm giác gì?"
  Sau khi học sinh trả lời → đánh giá + phân tích sâu hơn về cách nhịp điệu phản ánh nội dung (ví dụ: nhịp 2/3 gợi sự dứt khoát, nhịp 3/2 gợi sự trôi chảy...). Thêm [RHYTHM] minh họa.

LƯỢT 3 – Nhập vai chủ thể trữ tình:
  Hỏi: "Nếu bạn là nhân vật trong bài thơ, bạn đang ở đâu, đang làm gì, và đang cảm thấy điều gì? Hãy thử mô tả bằng lời của chính bạn."
  Sau khi học sinh trả lời → khen nét tưởng tượng hay + bổ sung thêm chiều sâu tâm lý của chủ thể trữ tình.

Chỉ chuyển sang Bước 2 khi học sinh đã: (1) xác định được giọng điệu, (2) nhận ra nhịp thơ, (3) có cảm nhận về chủ thể trữ tình.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 2: XÁC ĐỊNH TÍN HIỆU THẨM MĨ
(Mục tiêu: Học sinh TỰ PHÁT HIỆN từ ngữ "đắt" – những tín hiệu mang nhiều lớp nghĩa)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bước 2 CẦN có ÍT NHẤT 3 lượt trao đổi:

Trước tiên: Giải thích ngắn gọn sự khác nhau giữa kí hiệu thông thường và tín hiệu thẩm mĩ:
  "Từ 'nhỏ' chỉ có một nghĩa – nói về kích thước. Nhưng 'loắt choắt' thì vừa gợi nhỏ bé, vừa gợi nhanh nhẹn, vừa tạo cảm giác đáng yêu. Đó là tín hiệu thẩm mĩ – đa nghĩa và giàu cảm xúc."

LƯỢT 1 – Phát hiện tín hiệu:
  Hỏi: "Trong đoạn thơ này, từ hoặc cụm từ nào khiến bạn dừng lại và cảm thấy 'từ này hay quá'? Tại sao?"

LƯỢT 2 – So sánh với từ thông thường:
  Sau khi học sinh chỉ ra từ → hỏi: "Bạn thử thay từ [X] bằng một từ thông thường khác có nghĩa tương tự – câu thơ thay đổi như thế nào?"
  → Phân tích sự mất mát khi thay từ: nghĩa nào biến mất, cảm xúc nào không còn.

LƯỢT 3 – Tìm thêm tín hiệu khác:
  "Ngoài [từ học sinh vừa tìm], bạn có để ý thêm tín hiệu thẩm mĩ nào khác trong đoạn thơ không? Đặc biệt chú ý những chỗ tác giả dùng từ 'lạ' hoặc hình ảnh bất ngờ."
  → Thêm [HIGHLIGHT] cho tất cả tín hiệu đã xác nhận.

Chỉ chuyển sang Bước 3 khi học sinh đã tìm được ít nhất 2-3 tín hiệu thẩm mĩ và hiểu TẠI SAO chúng "đắt" hơn từ thông thường.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 3: PHÂN DẠNG TÍN HIỆU THẨM MĨ
(Mục tiêu: Học sinh phân loại tín hiệu – không chỉ nhận ra mà còn hiểu CƠ CHẾ hoạt động)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

4 dạng tín hiệu cần hướng dẫn học sinh nhận ra:

Dạng 1 – ĐẶC TRƯNG THỂ LOẠI: thể thơ, nhịp, vần điệu.
  → Cách nhận: "Đây là tín hiệu thẩm mĩ ở cấp độ âm thanh và cấu trúc."

Dạng 2 – TỪ NGỮ ĐẶC BIỆT: từ được cắt nghĩa lại, từ chính xác không thể thay, từ tượng thanh/tượng hình (vi vu, xôn xao, chênh vênh...).
  → Cách nhận: "Thử thay bằng từ khác – nếu câu thơ mất đi điều gì, đó là tín hiệu thẩm mĩ."

Dạng 3 – BIỆN PHÁP TU TỪ: so sánh, ẩn dụ, hoán dụ, điệp ngữ, điệp thanh, liệt kê, nhân hóa, câu hỏi tu từ, đối...
  → Với mỗi biện pháp: chỉ rõ HIỆU QUẢ cụ thể (điệp thanh → nhạc tính; liệt kê → tạo không gian rộng mở...).

Dạng 4 – CẤU TRÚC CÚ PHÁP: đảo ngữ, kết hợp từ lạ, cấu trúc song hành.
  → "Khi tác giả đảo vị trí từ trong câu, điều gì được nhấn mạnh lên?"

Bước 3 CẦN ÍT NHẤT 2 lượt:
  LƯỢT 1: Học sinh tự phân loại từng tín hiệu đã tìm ở Bước 2.
  LƯỢT 2: Mình chỉnh sửa + bổ sung những tín hiệu học sinh bỏ sót, giải thích tại sao phân loại như vậy.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 4: GIẢI MÃ TÍN HIỆU THẨM MĨ
(Mục tiêu: Học sinh hiểu DỤNG Ý NGHỆ THUẬT – tại sao tác giả dùng cách này và nó tác động thế nào)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Đây là bước quan trọng và sâu nhất. CẦN ÍT NHẤT 3-4 lượt trao đổi, mỗi lượt đào sâu vào 1-2 tín hiệu.

Với MỖI tín hiệu thẩm mĩ quan trọng, đặt 3 câu hỏi theo trình tự:

  Q1 – Bề mặt: "Câu thơ này nói về điều gì (theo nghĩa đen)?"
  Q2 – Chiều sâu: "Nhưng tại sao tác giả lại nói như THẾ NÀY mà không nói thẳng? Cách nói này gợi lên điều gì thêm?"
  Q3 – Dụng ý: "Nếu bỏ tín hiệu này đi, cảm xúc/hình ảnh của bài thơ sẽ thiếu điều gì?"

Kỹ thuật đặc biệt – Chỉ ra SỰ PHI LÝ HỢP LÝ:
  Nhiều tín hiệu thẩm mĩ hay nhất là những điều phi lý về mặt thực tế nhưng hoàn toàn hợp lý về mặt cảm xúc.
  Ví dụ: "Tắt nắng", "buộc gió" – phi lý về vật lý nhưng cực kỳ hợp lý với tâm hồn Xuân Diệu đang khao khát giữ lại vẻ đẹp.
  → Hỏi học sinh: "Điều này có vẻ không thể xảy ra ngoài đời thực – nhưng bạn có thể hiểu tại sao tác giả lại viết như vậy không?"

Kỹ thuật liên hệ – Huy động vốn sống:
  Sau khi giải mã xong, hỏi: "Bạn có bao giờ cảm thấy điều tương tự không? Khi nào?"
  → Giúp học sinh kết nối cảm xúc thơ với trải nghiệm thực của chính mình.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ĐIỀU KIỆN CHUYỂN SANG BƯỚC 5 – TỔNG KẾT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CHỈ chuyển sang Bước 5 khi TẤT CẢ các điều sau đều đúng:
✓ Học sinh đã trả lời câu hỏi cuối cùng của Bước 4 (giải mã ít nhất 2 tín hiệu thẩm mĩ)
✓ Học sinh đã liên hệ được với vốn sống hoặc cảm xúc cá nhân
✓ Không còn tín hiệu thẩm mĩ quan trọng nào chưa được thảo luận

Khi đủ điều kiện: NGAY LẬP TỨC chuyển sang Bước 5. KHÔNG hỏi thêm. KHÔNG dẫn dắt thêm.
Nếu chưa đủ: tiếp tục đào sâu Bước 4 thêm 1-2 lượt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BƯỚC 5: TỔNG KẾT (TỰ ĐỘNG SAU KHI ĐỦ ĐIỀU KIỆN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cấu trúc phản hồi Bước 5 theo đúng thứ tự này:

1. Đoạn văn tóm tắt hành trình (2-3 câu ấm áp, không máy móc).
2. Dòng: [SUMMARY_MODE]
3. Khối JSON (BẮT BUỘC có dấu backtick bao ngoài):

\`\`\`json
{
  "tone": "mô tả giọng điệu chủ đạo",
  "rhythm": "thể thơ + đặc điểm nhịp điệu",
  "highlights": [
    {"word": "từ/cụm từ cụ thể trong bài", "analysis": "phân tích dụng ý nghệ thuật cụ thể, ít nhất 1 câu đầy đủ"},
    {"word": "từ/cụm từ 2", "analysis": "phân tích cụ thể"}
  ],
  "mainIdea": "cảm hứng chủ đạo và thông điệp chính của đoạn thơ, 1-2 câu"
}
\`\`\`

4. Câu kết thúc nhẹ nhàng + 🔴 **CÂU HỎI TRỌNG TÂM:** (1 câu hỏi mở rộng về toàn bài thơ).

NGHIÊM CẤM trong Bước 5:
- Không render JSON thô (phải có backtick bao ngoài)
- Không dùng "đã phân tích", "đã đề cập", "đã xác định" trong trường "analysis"
- Không hỏi thêm bất kỳ câu nào TRƯỚC khi viết [SUMMARY_MODE]`;

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 400): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error: any) {
      attempt++;
      const errorMessage = error?.message || '';
      const isRetryable =
        error?.status === 429 ||
        error?.status >= 500 ||
        errorMessage.includes('429') ||
        errorMessage.includes('500') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('Internal') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError') ||
        errorMessage.includes('Load failed');
      if (!isRetryable || attempt >= maxRetries) {
        throw error;
      }
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries reached');
}

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  isAudioLoading?: boolean;
}


interface SummaryData {
  tone: string;
  rhythm: string;
  highlights: { word: string; analysis: string }[];
  mainIdea: string;
}


interface StepRecap {
  step: number;
  title: string;
  status: string;
  note: string;
  details: string[];
}

interface ChatInterfaceProps {
  poem: string;
  author: string;
  onBack: () => void;
}

interface ChatChunk {
  text: string;
}

interface ChatSession {
  sendMessageStream: ({ message }: { message: string }) => AsyncGenerator<ChatChunk, void, unknown>;
}

interface PollinationsMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const DEFAULT_TEXT_ENDPOINT = 'https://text.pollinations.ai/openai/v1/chat/completions';
const TEXT_API_BASE = (import.meta as any).env?.VITE_TEXT_API_BASE as string | undefined;
const SHOULD_USE_LOCAL_API = (import.meta as any).env?.VITE_USE_LOCAL_API === 'true';
const TEXT_API_ENDPOINTS = TEXT_API_BASE
  ? [`${TEXT_API_BASE.replace(/\/$/, '')}/openai/v1/chat/completions`]
  : SHOULD_USE_LOCAL_API
    ? ['/api/chat', DEFAULT_TEXT_ENDPOINT]
    : [DEFAULT_TEXT_ENDPOINT, '/api/chat'];
const TEXT_MODELS = ['openai', 'openai-large'];
const USE_PUTER_GEMINI = (import.meta as any).env?.VITE_USE_PUTER_GEMINI !== 'false';
const STEP_TITLES = [
  'Tri giác đoạn thơ',
  'Xác định tín hiệu thẩm mĩ',
  'Phân dạng tín hiệu',
  'Giải mã tín hiệu',
];

const ELEVENLABS_TTS_ENDPOINT = '/api/tts';
const ELEVENLABS_VOICE_ID = (import.meta as any).env?.VITE_ELEVENLABS_VOICE_ID as string | undefined || 'pNInz6obpgDQGcFmaJgB';
const PUTER_ELEVENLABS_VOICE_ID = ELEVENLABS_VOICE_ID;

interface AudioTask {
  text: string;
  isFetching: boolean;
  isReady: boolean;
  isFailed: boolean;
  base64Audio?: string;
  onStart?: () => void;
  onEnd?: () => void;
}

const safeText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');
const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeSummaryData = (raw: Partial<SummaryData> | null | undefined): SummaryData | null => {
  if (!raw) return null;
  return {
    tone: safeText(raw.tone),
    rhythm: safeText(raw.rhythm),
    highlights: Array.isArray(raw.highlights)
      ? raw.highlights
          .map((h: any) => ({ word: safeText(h?.word), analysis: safeText(h?.analysis) }))
          .filter((h) => h.word)
      : [],
    mainIdea: safeText(raw.mainIdea),
  };
};

const pickUnique = (items: string[]): string[] => {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of items.map((i) => i.trim()).filter(Boolean)) {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
};

const extractKeywords = (text: string, keywords: string[]): string[] => {
  return keywords.filter((keyword) => new RegExp(`\\b${keyword}\\b`, 'i').test(text));
};


export function ChatInterface({ poem, author, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showMobilePoem, setShowMobilePoem] = useState(false);
  const [mobileTab, setMobileTab] = useState<'poem' | 'chat'>('poem');
  
  const [initStage, setInitStage] = useState<'analyzing' | 'reading' | 'ready'>('reading');
  const [poemTone] = useState('truyền cảm');
  const [readingPoemLine, setReadingPoemLine] = useState<number | null>(null);
  const activePoemLineRef = useRef<HTMLDivElement>(null);
  
  const [highlights, setHighlights] = useState<string[]>([]);
  const [isSummaryMode, setIsSummaryMode] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [rhythmLines, setRhythmLines] = useState<string[]>([]);
  
  const [ttsError, setTtsError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const convoHistoryRef = useRef<PollinationsMessage[]>([]);
  const unavailableEndpointsRef = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only auto-scroll when a new message is added or loading state changes,
    // not on every chunk during streaming, so users can read from the top.
    scrollToBottom();
  }, [messages.length, isLoading, initStage]);

  useEffect(() => {
    if (readingPoemLine !== null && activePoemLineRef.current) {
      activePoemLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [readingPoemLine]);

  const callTextAI = async (conversation: PollinationsMessage[]): Promise<string> => {
    let lastError: unknown;

    if (USE_PUTER_GEMINI && isPuterAvailable()) {
      try {
        return await callPuterGemini(conversation);
      } catch (error) {
        lastError = error;
      }
    }

    for (const endpoint of TEXT_API_ENDPOINTS) {
      if (unavailableEndpointsRef.current.has(endpoint)) continue;

      for (const model of TEXT_MODELS) {
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort('Text API timeout'), 45000);

        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: JSON.stringify({
              model,
              messages: conversation,
              temperature: 0.35,
            }),
            signal: controller.signal,
          });

          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 404 && endpoint.startsWith('/api/')) {
              unavailableEndpointsRef.current.add(endpoint);
            }
            throw new Error(`Text API failed (${response.status}, endpoint=${endpoint}, model=${model}): ${errorText}`);
          }

          const data = await response.json();
          const text = data?.choices?.[0]?.message?.content?.trim();
          if (!text) {
            throw new Error(`Text API returned empty content (endpoint=${endpoint}, model=${model})`);
          }

          return text;
        } catch (error: any) {
          if (error?.name === 'AbortError') {
            lastError = new Error(`Text API timeout (endpoint=${endpoint}, model=${model})`);
          } else {
            lastError = error;
          }
        } finally {
          window.clearTimeout(timeout);
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Text API failed with unknown error');
  };

  const createChatSession = (historyRef: React.MutableRefObject<PollinationsMessage[]>): ChatSession => {
    return {
      sendMessageStream: async function* ({ message }) {
        historyRef.current.push({ role: 'user', content: message });

        if (USE_PUTER_GEMINI && isPuterAvailable()) {
          try {
            let puterText = '';
            const stream = streamPuterGemini(historyRef.current);
            for await (const part of stream) {
              puterText += part;
              yield { text: part };
            }

            if (puterText.trim()) {
              historyRef.current.push({ role: 'assistant', content: puterText });
              return;
            }
          } catch (error) {
            console.warn('Puter stream failed, fallback to text API:', error);
          }
        }

        const fullText = await withRetry(() => callTextAI(historyRef.current));
        historyRef.current.push({ role: 'assistant', content: fullText });
        yield { text: fullText };
      },
    };
  };

  const parseMarkup = (text: string) => {
    if (text.includes('[CLEAR_MARKUP]')) {
      setHighlights([]);
      setRhythmLines([]);
    }

    const rhythmMatches = Array.from(text.matchAll(/\[RHYTHM:\s*([^\]]*?)\]/g));
    if (rhythmMatches.length > 0) {
      const lastRhythm = rhythmMatches[rhythmMatches.length - 1]?.[1] || '';
      const lines = lastRhythm.split(',').map(l => l.trim()).filter(Boolean);
      setRhythmLines(lines);
    }

    const highlightMatches = Array.from(text.matchAll(/\[HIGHLIGHT:\s*([^\]]*?)\]/g));
    if (highlightMatches.length > 0) {
      const lastHighlight = highlightMatches[highlightMatches.length - 1]?.[1] || '';
      const words = lastHighlight.split(',').map(w => w.trim()).filter(Boolean);
      setHighlights(words);
    }
    
    if (text.includes('[SUMMARY_MODE]')) {
      setIsSummaryMode(true);
      
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          setSummaryData(normalizeSummaryData(parsed));
        } catch (e) {
          console.error("Failed to parse summary JSON", e);
        }
      }
      
      // Extract the summary text (everything before the tag)
      const cleanText = text.replace(/\[SUMMARY_MODE\]/g, '').replace(/\[RHYTHM:.*?\]/g, '').replace(/\[HIGHLIGHT:.*?\]/g, '').replace(/```json[\s\S]*?```/g, '').trim();
      setSummaryText(cleanText);
    }
  };



  const effectiveSummaryData = useMemo<SummaryData>(() => {
    const modelTexts = messages.filter((m) => m.role === 'model').map((m) => m.text);

    // Extract actual analysis for a highlighted word from model messages
    const stripMd = (s: string) =>
      s.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
       .replace(/`([^`]+)`/g, '$1')
       .replace(/^#{1,4}\s*/gm, '')
       .replace(/^[-*>]\s+/gm, '')
       .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
       .trim();

    const extractWordAnalysis = (word: string): string => {
      for (const text of [...modelTexts].reverse()) {
        const sentences = text
          .split(/[.!?\n]+/)
          .map((s) => stripMd(s.trim()))
          .filter((s) => s.length > 20);
        const relevant = sentences.filter(
          (s) =>
            new RegExp(word, 'i').test(s) &&
            !s.startsWith('BƯỚC') &&
            !s.startsWith('###') &&
            !s.startsWith('🔴') &&
            !s.startsWith('ĐÁNH GIÁ') &&
            !s.startsWith('GỢI Ý') &&
            !s.startsWith('CÂU HỎI'),
        );
        if (relevant.length > 0) return relevant.slice(0, 2).map(stripMd).join('. ');
      }
      return '';
    };

    // Extract tone from model messages
    const stripMdSimple = (s: string) =>
      s.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1').replace(/`([^`]+)`/g, '$1').trim();
    const extractTone = (): string => {
      for (const text of [...modelTexts].reverse()) {
        const m =
          text.match(/giọng\s*điệu[^\n:]*[:：]\s*([^\n.]{5,80})/i) ||
          text.match(/(?:giọng|tông)\s+([^\n,]{5,60}(?:buồn|vui|tha thiết|da diết|trầm|lắng|suy tư|thiết tha)[^\n,]{0,40})/i);
        if (m) return stripMdSimple(m[1]);
      }
      return '';
    };

    // Extract rhythm from model messages
    const extractRhythm = (): string => {
      for (const text of [...modelTexts].reverse()) {
        const m =
          text.match(/nhịp\s*(?:thơ|điệu)?[^\n:]*[:：]\s*([^\n.]{5,80})/i) ||
          text.match(/nhịp\s+(\d[^\n,]{2,60})/i);
        if (m) return m[1].trim();
      }
      return '';
    };

    // Extract main idea from summaryText or messages
    const extractMainIdea = (): string => {
      if (summaryText) {
        const lines = summaryText
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l && !l.startsWith('###') && !l.startsWith('🔴') && l.length > 30);
        if (lines[0]) return lines[0].replace(/^[*_]+|[*_]+$/g, '');
      }
      for (const text of [...modelTexts].reverse()) {
        const m =
          text.match(/(?:chủ đề|nội dung chính|cảm hứng chủ đạo)[^\n:]*[:：]\s*([^\n.]{20,})/i) ||
          text.match(/(?:bài thơ|đoạn thơ)\s+(?:nói|thể hiện|diễn tả|ca ngợi|khắc họa)[^\n]{10,80}/i);
        if (m) return (m[1] || m[0]).trim().slice(0, 150);
      }
      return '';
    };

    const base = normalizeSummaryData(summaryData) || { tone: '', rhythm: '', highlights: [], mainIdea: '' };

    const fallbackHighlights = highlights.map((word) => {
      const analysis = extractWordAnalysis(word);
      return {
        word,
        analysis: analysis || `Tín hiệu "${word}" đã được xác định và làm nổi bật trên văn bản thơ (Bước 2).`,
      };
    });

    const inferredTone = base.tone || extractTone();
    const inferredRhythm = base.rhythm || extractRhythm() || (rhythmLines.length ? rhythmLines.join(' | ') : '');
    const inferredMainIdea = base.mainIdea || extractMainIdea();

    return {
      tone: inferredTone || 'Chưa xác nhận rõ giọng điệu – hãy trả lời câu hỏi Bước 1 để cập nhật.',
      rhythm: inferredRhythm || 'Chưa có nhịp được xác nhận – hãy trả lời câu hỏi nhịp điệu ở Bước 1.',
      highlights: base.highlights.length ? base.highlights : fallbackHighlights,
      mainIdea: inferredMainIdea || 'Chưa có kết luận nội dung chính – hãy hoàn thành đến Bước 4 để tổng kết.',
    };
  }, [summaryData, highlights, rhythmLines, summaryText, messages]);

  const stepRecap = useMemo<StepRecap[]>(() => {
    const modelTexts = messages.filter((m) => m.role === 'model').map((m) => m.text);

    return STEP_TITLES.map((title, index) => {
      const step = index + 1;
      const related = [...modelTexts].reverse().find((text) => new RegExp(`BƯỚC\\s*${step}`, 'i').test(text));
      const evaluationMatch = related?.match(/ĐÁNH GIÁ\s*[:：]\s*([^\n]+)/i);
      const questionMatch = related?.match(/CÂU HỎI TRỌNG TÂM\s*[:：]\s*([^\n]+)/i);

      let details: string[] = [];

      if (step === 1) {
        const rhythmDetail = rhythmLines.length
          ? [`Đã xác nhận nhịp thơ: ${rhythmLines.slice(0, 2).join(' | ')}${rhythmLines.length > 2 ? ' ...' : ''}.`]
          : [];
        const toneDetail =
          effectiveSummaryData.tone && !effectiveSummaryData.tone.startsWith('Chưa')
            ? [`Đã nhận diện giọng điệu: ${effectiveSummaryData.tone}.`]
            : [];
        details = [...toneDetail, ...rhythmDetail];
      }

      if (step === 2) {
        details = effectiveSummaryData.highlights.length
          ? [
              `Tín hiệu thẩm mĩ đã tìm: ${effectiveSummaryData.highlights.map((h) => h.word).slice(0, 6).join(', ')}${effectiveSummaryData.highlights.length > 6 ? ' ...' : ''}.`,
              'Đã làm nổi bật trực tiếp các từ/cụm từ trên văn bản thơ.',
            ]
          : [];
      }

      if (step === 3) {
        const categories = extractKeywords(
          `${related || ''} ${summaryText}`,
          ['ẩn dụ', 'so sánh', 'điệp', 'hoán dụ', 'đảo ngữ', 'nhịp', 'vần', 'cú pháp'],
        );
        details = categories.length
          ? [
              `Đã phân dạng tín hiệu theo nhóm: ${pickUnique(categories).join(', ')}.`,
              'Đã đối chiếu tín hiệu vào nhóm thể loại, từ ngữ, tu từ hoặc cú pháp.',
            ]
          : [];
      }

      if (step === 4) {
        const idea = effectiveSummaryData.mainIdea;
        details =
          idea && !idea.startsWith('Chưa có kết luận')
            ? [
                `Đã giải mã ý nghĩa trung tâm: ${idea.slice(0, 120)}${idea.length > 120 ? '...' : ''}.`,
                'Đã liên hệ hiệu quả nghệ thuật của tín hiệu với cảm xúc/chủ đề bài thơ.',
              ]
            : [];
      }

      if (!details.length) {
        details = ['Bạn có thể bổ sung thêm câu trả lời ở bước này để hoàn thiện bảng tổng kết.'];
      }

      const hasEvidence = details[0] && !details[0].startsWith('Bạn có thể');

      return {
        step,
        title,
        status: related ? 'Đã thực hiện' : 'Chưa ghi nhận',
        note:
          evaluationMatch?.[1]?.trim() ||
          questionMatch?.[1]?.trim() ||
          (hasEvidence ? 'Đã có bằng chứng từ quá trình học.' : 'Đang chờ cập nhật từ hội thoại.'),
        details,
      };
    });
  }, [messages, rhythmLines, effectiveSummaryData, summaryText]);

  const downloadMindMap = () => {
    const width = 1700;
    const height = 1150;
    const centerX = width / 2;
    const centerY = 160;

    const nodes = [
      { x: centerX, y: centerY, title: `Tổng kết: ${author}`, body: effectiveSummaryData.mainIdea, color: '#5A5A40' },
      { x: 240, y: 390, title: 'Giọng điệu', body: effectiveSummaryData.tone, color: '#2563eb' },
      { x: 1460, y: 390, title: 'Nhịp thơ', body: effectiveSummaryData.rhythm, color: '#dc2626' },
      {
        x: 240,
        y: 760,
        title: 'Điểm sáng ngôn từ',
        body: effectiveSummaryData.highlights.length
          ? effectiveSummaryData.highlights.map((h) => `${h.word}: ${h.analysis}`).join(' | ')
          : 'Chưa có điểm sáng được xác nhận.',
        color: '#ca8a04',
      },
      {
        x: 1460,
        y: 760,
        title: 'Hành trình phân tích',
        body: stepRecap.map((s) => `Bước ${s.step} – ${s.title}: ${s.details[0] || s.status}`).join(' ◆ '),
        color: '#7c3aed',
      },
    ];

    const wrap = (text: string, maxLen = 38): string[] => {
      const words = text.split(/\s+/).filter(Boolean);
      const lines: string[] = [];
      let line = '';

      for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (candidate.length > maxLen) {
          if (line) lines.push(line);
          line = word;
        } else {
          line = candidate;
        }
      }
      if (line) lines.push(line);
      return lines.slice(0, 8);
    };

    const edges = [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ];

    const edgeSvg = edges
      .map(([a, b]) => {
        const from = nodes[a];
        const to = nodes[b];
        return `<path d="M ${from.x} ${from.y + 70} C ${from.x} ${from.y + 200}, ${to.x} ${to.y - 200}, ${to.x} ${to.y - 70}" stroke="#cbd5e1" stroke-width="4" fill="none" />`;
      })
      .join('');

    const nodeSvg = nodes
      .map((node) => {
        const lines = wrap(node.body);
        const title = escapeXml(node.title);
        const lineHeight = 26;
        const bodyHeight = lines.length * lineHeight;
        const paddingTop = 55;
        const paddingBottom = 30;
        const rectHeight = paddingTop + bodyHeight + paddingBottom;
        const lineSvg = lines
          .map((line, idx) => `<tspan x="${node.x}" dy="${idx === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
          .join('');

        return `
          <g>
            <rect x="${node.x - 265}" y="${node.y - paddingTop - 10}" width="530" height="${rectHeight}" rx="28" fill="white" stroke="${node.color}" stroke-width="3" filter="drop-shadow(0 2px 8px rgba(0,0,0,0.07))" />
            <text x="${node.x}" y="${node.y - 15}" text-anchor="middle" font-size="26" font-family="Georgia, serif" fill="${node.color}" font-weight="700">${title}</text>
            <line x1="${node.x - 220}" y1="${node.y + 5}" x2="${node.x + 220}" y2="${node.y + 5}" stroke="${node.color}" stroke-width="1" opacity="0.25" />
            <text x="${node.x}" y="${node.y + 28}" text-anchor="middle" font-size="21" font-family="Arial, sans-serif" fill="#334155">${lineSvg}</text>
          </g>
        `;
      })
      .join('');

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="100%" stop-color="#eef2ff" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)" />
        <text x="${width / 2}" y="60" text-anchor="middle" font-size="34" font-family="Georgia, serif" fill="#1e293b" font-weight="700">Sơ đồ tư duy bài học thẩm mĩ thơ ca</text>
        ${edgeSvg}
        ${nodeSvg}
      </svg>
    `;

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mindmap-${author.replace(/\s+/g, '-').toLowerCase() || 'tho-ca'}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderPoem = () => {
    let lines = poem.split('\n');
    
    return lines.map((line, index) => {
      let displayLine = line;
      
      if (rhythmLines.length > 0) {
        const getWords = (s: string) => s.replace(/[.,!?/]/g, '').trim().toLowerCase().split(/\s+/).filter(Boolean);
        const originalWords = getWords(line).join(' ');
        
        const matchedRhythm = rhythmLines.find(rl => {
          const aiWords = getWords(rl).join(' ');
          return originalWords === aiWords && originalWords.length > 0;
        });
        
        if (matchedRhythm) {
          displayLine = matchedRhythm;
        }
      }
      
      let lineElements: React.ReactNode[] = [displayLine];
      
      let spanCounter = 0;
      if (highlights.length > 0) {
        highlights.forEach(word => {
          if (!word) return;
          const regex = new RegExp(`(${word})`, 'gi');
          lineElements = lineElements.flatMap(part => {
            if (typeof part === 'string') {
              const splits = part.split(regex);
              return splits.map((s) => {
                if (s.toLowerCase() === word.toLowerCase()) {
                  spanCounter++;
                  return <span key={`highlight-${spanCounter}`} className="bg-gradient-to-r from-yellow-200 to-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-md font-semibold transition-all duration-500 shadow-sm inline-block hover:scale-110 hover:-translate-y-0.5 cursor-default">{s}</span>;
                }
                return s;
              });
            }
            return part;
          });
        });
      }
      
      lineElements = lineElements.flatMap(part => {
        if (typeof part === 'string') {
          const splits = part.split(/(\/)/);
          return splits.map((s) => {
            if (s === '/') {
              spanCounter++;
              return <span key={`rhythm-${spanCounter}`} className="text-red-500/80 font-bold mx-2 animate-pulse scale-125 inline-block select-none">/</span>;
            }
            return s;
          });
        }
        return part;
      });

      const isReading = readingPoemLine === index || readingPoemLine === -1;

      return (
        <div 
          key={index} 
          ref={isReading ? activePoemLineRef : null}
          className={`min-h-[1.5rem] transition-all duration-500 hover:bg-white/60 hover:pl-2 rounded-lg cursor-default ${isReading ? 'bg-yellow-100/80 text-yellow-900 font-medium px-4 py-1 rounded-xl -mx-4 shadow-sm scale-[1.02] transform' : 'py-1'}`}
        >
          {lineElements}
        </div>
      );
    });
  };

  const audioTasks = useRef<AudioTask[]>([]);
  const isPlayingAudio = useRef(false);

  const stopAllAudio = () => {
    audioTasks.current = [];
    isPlayingAudio.current = false;
  };

  const addAudioTask = (text: string, onStart?: () => void, onEnd?: () => void) => {
    const task: AudioTask = { text, isFetching: false, isReady: false, isFailed: false, onStart, onEnd };
    audioTasks.current.push(task);
    fetchNextAudio();
  };


  // TTS: FPT AI only — no Web Speech, no Puter fallback

  const fetchNextAudio = async () => {
    const task = audioTasks.current.find(t => !t.isFetching && !t.isReady && !t.isFailed);
    if (!task) return;

    task.isFetching = true;

    // Helper: fetch audio blob → base64 (preserve actual mime type)
    const toBase64 = async (res: Response): Promise<string> => {
      const mime = res.headers.get('content-type')?.split(';')[0]?.trim() || 'audio/mpeg';
      const buf = await res.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = '';
      for (let i = 0; i < bytes.length; i += 0x8000)
        bin += String.fromCharCode(...bytes.slice(i, i + 0x8000));
      return `data:${mime};base64,${btoa(bin)}`;
    };

    try {
      // ── Ưu tiên 1: FPT AI TTS (giọng linhsan) ──
      const fptRes = await fetch(ELEVENLABS_TTS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: task.text }),
      });
      if (!fptRes.ok) throw new Error(`FPT ${fptRes.status}: ${await fptRes.text()}`);
      task.base64Audio = await toBase64(fptRes);
      task.isReady = true;
      setTtsError(null);
    } catch (fptError: any) {
      console.warn('FPT TTS failed:', fptError.message);
      // Không còn fallback Web Speech — nếu FPT lỗi thì skip phần audio
      task.isFailed = true;
      setTtsError(`FPT TTS lỗi: ${fptError.message}. Kiểm tra FPT_TTS_API_KEY trên Vercel.`);
    } finally {
      task.isFetching = false;
      playNextAudio();
      fetchNextAudio();
    }
  };

  const playNextAudio = async () => {
    if (isPlayingAudio.current) return;
    
    const task = audioTasks.current[0];
    if (!task) return;
    
    if (!task.isReady && !task.isFailed) return;
    
    audioTasks.current.shift();
    
    if (task.isReady && task.base64Audio) {
      isPlayingAudio.current = true;
      if (task.onStart) task.onStart();
      try {
        if (task.base64Audio.startsWith('data:audio/')) {
          await new Promise<void>((resolve, reject) => {
            const audio = new Audio(task.base64Audio);
            audio.onended = () => resolve();
            audio.onerror = () => reject(new Error('Failed to play ElevenLabs audio'));
            audio.play().catch(reject);
          });
        }
      } catch (e) {
        console.error("Play error", e);
      } finally {
        if (task.onEnd) task.onEnd();
        isPlayingAudio.current = false;
        playNextAudio();
      }
    } else {
      // TTS failed nhưng vẫn gọi onEnd để chat không bị block
      if (task.onEnd) task.onEnd();
      playNextAudio();
    }
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initializeMentoring = async () => {
      try {
        convoHistoryRef.current = [{ role: 'system', content: SYSTEM_PROMPT }];

        // BƯỚC 1: Đọc bài thơ bằng TTS – đợi xong mới phân tích
        setInitStage('reading');
        setMessages([{
          id: 'system-reading',
          role: 'model',
          text: '*🔊 Đang đọc bài thơ – mình lắng nghe trước khi bắt đầu phân tích nhé...*',
        }]);

        setReadingPoemLine(-1); // Highlight toàn bài

        await new Promise<void>((resolve) => {
          const poemText = `${author ? `${author}. ` : ''}${poem}`;
          addAudioTask(
            poemText,
            undefined,
            resolve, // onEnd → tiếp tục
          );
        });

        setReadingPoemLine(null);

        // BƯỚC 2: Khởi động chat và bắt đầu phân tích
        setMobileTab('chat'); // Switch to chat tab on mobile after poem reading
        setInitStage('ready');
        const chat = createChatSession(convoHistoryRef);
        setChatSession(chat);

        const initialPrompt = `Đoạn thơ: ${poem}\nTác giả: ${author}\nHãy bắt đầu BƯỚC 1.`;
        const responseStream = chat.sendMessageStream({ message: initialPrompt });

        const firstMessageId = Date.now().toString();
        setMessages(prev => [
          ...prev,
          { id: firstMessageId, role: 'model', text: '' },
        ]);

        let fullText = '';

        for await (const chunk of responseStream) {
          const chunkText = chunk.text || '';
          fullText += chunkText;

          const displayText = fullText
            .replace(/\*{1,2}\[RHYTHM:[^\]]*\]\*{1,2}/g, '')
            .replace(/\[RHYTHM:[^\]]*\]/g, '')
            .replace(/\*{1,2}\[HIGHLIGHT:[^\]]*\]\*{1,2}/g, '')
            .replace(/\[HIGHLIGHT:[^\]]*\]/g, '')
            .replace(/\[CLEAR_MARKUP\]/g, '')
            .replace(/\[SUMMARY_MODE\]/g, '')
            .replace(/```json[\s\S]*?```/g, '')
            .replace(/\n\s*\{\s*\n[\s\S]*?"mainIdea"[\s\S]*?\n\s*\}/g, '')
            .trim();
          setMessages((prev) => prev.map(m => m.id === firstMessageId ? { ...m, text: displayText } : m));

          parseMarkup(fullText);
        }
        
      } catch (error: any) {
        console.error('Initialization error:', error);
        let errorMessage = 'Xin lỗi, đã có lỗi xảy ra khi khởi tạo. Vui lòng thử lại sau.';
        if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
          errorMessage = 'Hệ thống đang quá tải hoặc hết hạn mức API. Vui lòng thử lại sau ít phút.';
        } else if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
          errorMessage = 'Không thể kết nối tới máy chủ AI (có thể do chặn mạng/CORS ở môi trường deploy). Vui lòng kiểm tra mạng hoặc đổi endpoint TEXT_API.';
        }
        setMessages([{
          id: Date.now().toString(),
          role: 'model',
          text: errorMessage,
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    initializeMentoring();
  }, [poem, author]);

  const sendChatMessage = async (userMessage: string) => {
    if (!chatSession) return;
    

    const newMessageId = Date.now().toString();
    setMessages((prev) => [
      ...prev,
      { id: newMessageId, role: 'user', text: userMessage },
    ]);
    setIsLoading(true);

    try {
      const responseStream = chatSession.sendMessageStream({ message: userMessage });
      const modelMessageId = (Date.now() + 1).toString();
      
      setMessages((prev) => [
        ...prev,
        { id: modelMessageId, role: 'model', text: '' },
      ]);
      
      setIsLoading(false);
      
      let fullText = '';
      
      for await (const chunk of responseStream) {
        const chunkText = chunk.text || '';
        fullText += chunkText;
        
        const displayText = fullText
          .replace(/\*{1,2}\[RHYTHM:[^\]]*\]\*{1,2}/g, '')
          .replace(/\[RHYTHM:[^\]]*\]/g, '')
          .replace(/\*{1,2}\[HIGHLIGHT:[^\]]*\]\*{1,2}/g, '')
          .replace(/\[HIGHLIGHT:[^\]]*\]/g, '')
          .replace(/\[CLEAR_MARKUP\]/g, '')
          .replace(/\[SUMMARY_MODE\]/g, '')
          .replace(/```json[\s\S]*?```/g, '')
          .replace(/\n\s*\{\s*\n[\s\S]*?"mainIdea"[\s\S]*?\n\s*\}/g, '')
          .trim();
        
        setMessages((prev) => prev.map(m => m.id === modelMessageId ? { ...m, text: displayText } : m));
        
        parseMarkup(fullText);
      }
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      let errorMessage = 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại.';
      if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
        errorMessage = 'Hệ thống đang quá tải hoặc hết hạn mức API. Vui lòng thử lại sau ít phút.';
      }
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: errorMessage,
        },
      ]);
      setIsLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || initStage !== 'ready') return;
    const text = input.trim();
    setInput('');
    await sendChatMessage(text);
  };

  return (
    <div className="flex flex-col h-screen bg-[#f5f5f0] max-w-5xl mx-auto shadow-2xl overflow-hidden md:rounded-3xl md:h-[95vh] md:my-[2.5vh]">
      {/* Header */}
      <header className="bg-white px-4 md:px-6 py-3 md:py-4 border-b border-[#e0e0d8] flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-[#f5f5f0] rounded-full transition-colors text-[#5A5A40]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="font-serif text-lg md:text-xl font-semibold text-[#2c2c28]">Mentor Thơ Ca</h2>
            <p className="text-[10px] md:text-xs text-[#7A7A5A] uppercase tracking-wider font-medium truncate max-w-[160px] md:max-w-none">{author}</p>
          </div>
        </div>
        {/* Mobile tab switcher (only when not in summary mode) */}
        {!isSummaryMode && (
          <div className="md:hidden flex items-center bg-[#f5f5f0] rounded-full p-1 gap-1">
            <button
              onClick={() => setMobileTab('poem')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${mobileTab === 'poem' ? 'bg-[#5A5A40] text-white shadow-sm' : 'text-[#5A5A40]'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Bài thơ
            </button>
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${mobileTab === 'chat' ? 'bg-[#5A5A40] text-white shadow-sm' : 'text-[#5A5A40]'}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Chat
            </button>
          </div>
        )}
      </header>

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className={`
          bg-[#fafafa] border-r border-[#e0e0d8] overflow-y-auto transition-all duration-300 ease-in-out
          ${isSummaryMode
            ? 'w-full border-r-0 flex flex-col items-center p-4 md:p-8 lg:p-12'
            : 'md:w-1/2 md:block p-4 md:p-8 lg:p-12'
          }
          ${!isSummaryMode && mobileTab === 'poem' ? 'block w-full' : ''}
          ${!isSummaryMode && mobileTab === 'chat' ? 'hidden md:block' : ''}
        `}>
          {!isSummaryMode ? (
            <>
              <h3 className="text-sm font-medium text-[#5A5A40] uppercase tracking-widest mb-6 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Nội dung tác phẩm
              </h3>
              <div className="transition-all duration-1000 w-full">
                <div className="font-serif text-base md:text-xl leading-[2.0] md:leading-[2.2] text-[#2c2c28] whitespace-pre-wrap italic pl-4 md:pl-6 py-4 md:py-6 bg-gradient-to-br from-white/80 to-white/40 rounded-2xl md:rounded-3xl shadow-sm backdrop-blur-sm">
                  {renderPoem()}
                </div>
              </div>
            </>
          ) : (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-6xl mx-auto py-4 md:py-8 px-2 md:px-0"
              >
                {/* Header Section */}
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center mb-16"
                >
                  <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] text-sm font-medium tracking-widest uppercase">
                    Kết quả giải mã tín hiệu thẩm mĩ
                  </div>
                  <h2 className="text-2xl md:text-5xl font-serif text-[#2c2c28] font-bold mb-4">Hành Trình Thẩm Mĩ</h2>
                  <div className="w-24 h-1 bg-[#5A5A40] mx-auto rounded-full opacity-30"></div>
                </motion.div>

                {/* Bento Grid Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-6 mb-8 md:mb-12">
                  
                  {/* Left Column: Tone & Rhythm (4/12) */}
                  <div className="md:col-span-1 lg:col-span-4 flex flex-col gap-4 md:gap-6">
                    <motion.div 
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-[#e0e0d8] flex-1 group hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Volume2 className="w-6 h-6 text-blue-600" />
                      </div>
                      <h4 className="text-xs font-bold text-[#7A7A5A] uppercase tracking-[0.2em] mb-3">Giọng điệu</h4>
                      <p className="text-2xl font-serif text-[#2c2c28] leading-tight italic">
                        {effectiveSummaryData.tone || "Đang cập nhật..."}
                      </p>
                    </motion.div>

                    <motion.div 
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className="bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-[#e0e0d8] flex-1 group hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                        <Activity className="w-6 h-6 text-red-600" />
                      </div>
                      <h4 className="text-xs font-bold text-[#7A7A5A] uppercase tracking-[0.2em] mb-3">Nhịp thơ</h4>
                      <p className="text-2xl font-serif text-[#2c2c28] leading-tight italic">
                        {effectiveSummaryData.rhythm || "Đang cập nhật..."}
                      </p>
                    </motion.div>
                  </div>

                  {/* Center Column: The Poem (4/12) */}
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.8 }}
                    className="md:col-span-2 lg:col-span-4 bg-[#2c2c28] text-white p-6 md:p-10 rounded-[28px] md:rounded-[40px] shadow-2xl relative overflow-hidden flex items-center justify-center min-h-[200px] md:min-h-[400px]"
                  >
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                    
                    <div className="relative z-10 w-full text-center">
                      <div className="font-serif text-xl md:text-2xl leading-[2.4] italic whitespace-pre-wrap opacity-90">
                        {renderPoem()}
                      </div>
                      <div className="mt-8 pt-6 border-t border-white/10">
                        <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-medium">{author}</p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Right Column: Highlights (4/12) */}
                  <motion.div 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                    className="md:col-span-1 lg:col-span-4 bg-white p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-[#e0e0d8] overflow-hidden"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <h4 className="text-xs font-bold text-[#7A7A5A] uppercase tracking-[0.2em]">Điểm sáng ngôn từ</h4>
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                    </div>
                    
                    <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {effectiveSummaryData.highlights?.map((h, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.5 + (i * 0.1) }}
                          className="relative pl-6 border-l-2 border-yellow-400/30 py-1"
                        >
                          <div className="absolute left-[-5px] top-2 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.6)]"></div>
                          <span className="text-lg font-serif font-bold text-[#2c2c28] block mb-1">
                            {h.word}
                          </span>
                          <p className="text-sm text-[#5A5A40] leading-relaxed italic">
                            {h.analysis.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1').replace(/`([^`]+)`/g, '$1')}
                          </p>
                        </motion.div>
                      ))}
                      {!effectiveSummaryData.highlights?.length && (
                        <div className="text-center py-12">
                          <p className="text-[#7A7A5A] italic text-sm">Chưa có điểm sáng được xác nhận ở phần học; bạn có thể quay lại Bước 2 để bổ sung.</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Main Idea Section (Full Width) */}
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                  className="bg-gradient-to-br from-[#5A5A40] to-[#4a4a35] text-white p-6 md:p-12 rounded-[24px] md:rounded-[40px] shadow-xl relative overflow-hidden mb-8 md:mb-12"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Lightbulb className="w-32 h-32" />
                  </div>
                  
                  <div className="relative z-10 max-w-3xl mx-auto text-center">
                    <h4 className="text-xs font-bold text-white/60 uppercase tracking-[0.3em] mb-6">Cảm hứng chủ đạo & Nội dung chính</h4>
                    <p className="text-lg md:text-3xl font-serif leading-relaxed italic">
                      "{effectiveSummaryData.mainIdea || "Đang tổng hợp nội dung..."}"
                    </p>
                  </div>
                </motion.div>

                {/* AI Commentary (Optional) */}
                {summaryText && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="max-w-3xl mx-auto mb-16 text-center"
                  >
                    <div className="inline-block p-1 mb-4 rounded-full bg-[#f5f5f0]">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Sparkles className="w-5 h-5 text-[#5A5A40]" />
                      </div>
                    </div>
                    <div className="markdown-body text-lg text-[#5A5A40] leading-relaxed font-serif italic">
                      <Markdown>{summaryText}</Markdown>
                    </div>
                  </motion.div>
                )}


                {/* 4-Step Recap */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="max-w-5xl mx-auto mb-12"
                >
                  <h4 className="text-xs font-bold text-[#7A7A5A] uppercase tracking-[0.25em] mb-5 text-center">Tổng hợp 4 bước tìm & giải mã tín hiệu thẩm mĩ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {stepRecap.map((item) => (
                      <div key={item.step} className="rounded-2xl border border-[#e0e0d8] bg-white px-5 py-4 shadow-sm">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-[#7A7A5A] mb-1">Bước {item.step}</p>
                        <p className="text-base font-semibold text-[#2c2c28] mb-1">{item.title}</p>
                        <span className={`inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full mb-2 ${item.status === 'Đã thực hiện' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span>
                        <div className="rounded-xl bg-[#fafaf6] border border-[#ececdf] px-3 py-2 mb-2">
                          <p className="text-[11px] uppercase tracking-[0.16em] text-[#7A7A5A] mb-1">Các việc đã làm</p>
                          <ul className="list-disc pl-4 space-y-1 text-sm text-[#4d4d36]">
                            {item.details.map((detail, idx) => (
                              <li key={idx}>{detail}</li>
                            ))}
                          </ul>
                        </div>
                        {item.note && !item.note.startsWith('Đang chờ') && (
                          <p className="text-xs text-[#66664a] italic leading-relaxed border-t border-[#ececdf] pt-2 mt-1">💬 {item.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="flex flex-col items-stretch sm:flex-row sm:items-center justify-center gap-3 mb-8 md:mb-12 px-2 sm:px-0"
                >
                  <button
                    onClick={onBack}
                    className="group px-6 py-4 bg-[#5A5A40] text-white rounded-full font-medium hover:bg-[#4a4a35] transition-all duration-300 shadow-lg flex items-center justify-center gap-3"
                  >
                    <BookOpen className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Khám phá tác phẩm mới
                  </button>
                  
                  <button
                    onClick={downloadMindMap}
                    className="px-6 py-4 bg-white text-[#5A5A40] border border-[#e0e0d8] rounded-full font-medium hover:bg-[#f5f5f0] transition-all duration-300 shadow-sm flex items-center justify-center gap-3"
                  >
                    <Feather className="w-5 h-5" />
                    Tải sơ đồ mind map
                  </button>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Chat Area */}
        <div className={`flex flex-col bg-white overflow-hidden relative transition-all duration-300 ease-in-out
          ${isSummaryMode ? 'w-0 opacity-0 pointer-events-none' : 'opacity-100'}
          ${!isSummaryMode && mobileTab === 'chat' ? 'flex-1 w-full' : ''}
          ${!isSummaryMode && mobileTab === 'poem' ? 'hidden md:flex md:flex-1 md:w-1/2' : ''}
          ${!isSummaryMode ? 'md:flex-1 md:w-1/2' : ''}
        `}>
          <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-[#e0e0d8] text-[#5A5A40]' : 'bg-[#5A5A40] text-white'
                  }`}>
                    {msg.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  </div>
                  
                  <div className={`max-w-[88%] md:max-w-[75%] rounded-2xl p-3 md:p-5 ${
                    msg.role === 'user' 
                      ? 'bg-[#f5f5f0] text-[#2c2c28] rounded-tr-sm' 
                      : 'bg-white border border-[#e0e0d8] text-[#2c2c28] rounded-tl-sm shadow-sm'
                  }`}>
                    {msg.role === 'model' && (
                      <div className="markdown-body text-[15px] leading-relaxed">
                        <Markdown
                          components={{
                            p: ({ children }) => {
                              const plain = Array.isArray(children) ? children.join('') : String(children ?? '');
                              if (plain.includes('CÂU HỎI TRỌNG TÂM')) {
                                return <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 font-semibold text-red-700">{children}</p>;
                              }
                              return <p>{children}</p>;
                            },
                          }}
                        >
                          {msg.text}
                        </Markdown>
                      </div>
                    )}
                    {msg.role === 'user' && (
                      <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {initStage === 'analyzing' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-4">
                <div className="bg-[#f5f5f0] text-[#5A5A40] px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-sm border border-[#e0e0d8]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang phân tích giọng điệu bài thơ...
                </div>
              </motion.div>
            )}
            
            {initStage === 'reading' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-4">
                <div className="bg-[#f5f5f0] text-[#5A5A40] px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-sm border border-[#e0e0d8]">
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  Đang đọc bài thơ bằng giọng FPT...
                </div>
              </motion.div>
            )}
            {ttsError && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center py-2">
                <div className="bg-red-50 text-red-700 px-4 py-2 rounded-xl text-xs border border-red-200 max-w-xs text-center">
                  ⚠️ {ttsError}
                </div>
              </motion.div>
            )}

            {isLoading && initStage === 'ready' && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="flex gap-4"
              >
                <div className="w-10 h-10 rounded-full bg-[#5A5A40] text-white flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="bg-white border border-[#e0e0d8] rounded-2xl rounded-tl-sm p-5 flex items-center gap-2 shadow-sm">
                  <div className="w-2 h-2 bg-[#5A5A40] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-[#5A5A40] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-[#5A5A40] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 md:p-4 bg-white border-t border-[#e0e0d8]">
            <form onSubmit={handleSend} className="relative flex items-end gap-2 max-w-4xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
                placeholder="Nhập câu trả lời của bạn..."
                className="w-full bg-[#f5f5f0] border-none rounded-2xl py-3 pl-4 pr-14 text-base focus:ring-2 focus:ring-[#5A5A40] resize-none max-h-32 min-h-[48px] md:min-h-[52px]"
                rows={1}
                disabled={isLoading || initStage !== 'ready'}
              />
              
              <div className="absolute right-2 bottom-1.5 flex items-center gap-1">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading || initStage !== 'ready'}
                  className="p-2 bg-[#5A5A40] text-white rounded-xl hover:bg-[#4a4a34] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
            <div className="text-center mt-2">
              <span className="text-[10px] text-[#7A7A5A] uppercase tracking-wider">Nhấn Enter để gửi, Shift + Enter để xuống dòng.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
