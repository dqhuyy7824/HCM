import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Calendar,
  Camera,
  CheckCircle,
  ChevronRight,
  Clock,
  Compass,
  ExternalLink,
  Flame,
  Flower,
  Heart,
  History,
  Home,
  Info,
  Loader2,
  MessageSquare,
  RotateCcw,
  Search,
  Send,
  Shield,
  Sparkles,
  Sword,
  Upload,
  User,
  ArrowLeft,
  Check,
  AlertTriangle,
  FileText,
  BadgeAlert,
  ChevronDown,
  X
} from 'lucide-react';
import { CHARACTERS, TIMELINE_EVENTS } from './data';
import { Character, TimelineEvent, ChatMessage, AccuracyAnalysis, ImageAnalysisResult } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'timeline' | 'analyzer'>('home');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  // Accuracy analysis state
  const [analyzingMsgId, setAnalyzingMsgId] = useState<string | null>(null);
  const [accuracyResult, setAccuracyResult] = useState<AccuracyAnalysis | null>(null);
  const [isCheckingAccuracy, setIsCheckingAccuracy] = useState(false);
  const [accuracyModalOpen, setAccuracyModalOpen] = useState(false);
  const [analyzingContentText, setAnalyzingContentText] = useState('');

  // Image analyzer state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysisResult | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  // Timeline modal state
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<TimelineEvent | null>(null);

  // Chat scroll anchor
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll inside chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  // Load chat history from localStorage on character select
  useEffect(() => {
    if (selectedCharacter) {
      const saved = localStorage.getItem(`vn_history_chat_${selectedCharacter.id}`);
      if (saved) {
        try {
          setChatMessages(JSON.parse(saved));
        } catch (e) {
          setChatMessages(getDefaultWelcome(selectedCharacter));
        }
      } else {
        setChatMessages(getDefaultWelcome(selectedCharacter));
      }
    } else {
      setChatMessages([]);
    }
    setAccuracyResult(null);
  }, [selectedCharacter]);

  // Save chat responses
  const saveChatMessages = (charId: string, messages: ChatMessage[]) => {
    localStorage.setItem(`vn_history_chat_${charId}`, JSON.stringify(messages));
    setChatMessages(messages);
  };

  const getDefaultWelcome = (char: Character): ChatMessage[] => {
    let welcome = '';
    switch (char.id) {
      case 'hcm':
        welcome = 'Thân ái chào các cháu học sinh và đồng bào thương yêu. Bác rất vui lòng được ngồi đây trò chuyện, chia sẻ với các cháu về lịch sử đấu tranh của dân tộc Việt Nam ta. Các cháu có câu hỏi nào về con đường cứu nước xưa kia hay rèn luyện bản thân hôm nay cứ tự nhiên hỏi Bác nhé.';
        break;
      case 'vng':
        welcome = 'Chào đồng chí và các bạn hữu yêu lịch sử nước nhà. Tôi là Võ Nguyên Giáp. Nghiên cứu lịch sử cốt để rút ra kinh nghiệm sương máu dựng nước và giữ nước. Bạn mong muốn bàn luận về chiến dịch Điện Biên Phủ, chiến tranh nhân dân, hay chiến thuật quân sự nào?';
        break;
      case 'thd':
        welcome = 'Hậu thế Đại Việt ta chung một cội nguồn bờ cõi. Ta là Tiết chế Trần Quốc Tuấn. Bốn phương mây khói binh biến dẫu xa nhưng đại nghĩa lòng dân muôn thuở vẫn là gốc rễ. Các ngươi muốn khảo luận điều chi về thuở kháng Nguyên oanh liệt hay phép dụng binh xưa?';
        break;
      case 'vts':
        welcome = 'Chị Sáu chào các em tinh thần yêu nước! Có gì vui không kể chị nghe với? Chị sẵn sàng san sẻ về những ngày đông can trường ở Đất Đỏ hay lòng khao khát độc lập độc tôn của tuổi trẻ ngày ấy.';
        break;
      case 'nt':
        welcome = 'Chào bậc khách hiền của hậu thế. Ta là Nguyễn Trãi, hiệu Ức Trai. Lòng nhân nghĩa chính là gốc của yên dân nước nhà. Nay hãy cùng ta đàm đạo về áng văn Bình Ngô Đại Cáo hay mưu phạt tâm công thu phục giặc Minh.';
        break;
      case 'qt':
        welcome = 'Ta là Quang Trung Nguyễn Huệ. Giang sơn thống nhất một dải là niềm khao khát lớn lao nhất đời ta. Hậu sinh muốn bàn thảo về những trận thần tốc dẹp Thăng Long đại phá quân Thanh hay kế sách mở cõi trị nước?';
        break;
      default:
        welcome = 'Chào bạn hữu. Tôi có thể hỗ trợ giải đáp chính xác tri thức lịch sử Việt Nam cho bạn.';
    }
    return [{
      id: 'welcome',
      role: 'model',
      content: welcome,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    }];
  };

  // Chat submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedCharacter || isSending) return;

    const userMessageContent = inputMessage;
    setInputMessage('');
    
    const newUserMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: userMessageContent,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...chatMessages, newUserMsg];
    saveChatMessages(selectedCharacter.id, updatedMessages);
    setIsSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          message: userMessageContent,
          history: updatedMessages.slice(0, -1) // Excluding the last message to avoid duplication in server's format
        })
      });

      const data = await response.json();
      if (response.ok && data.reply) {
        const newModelMsg: ChatMessage = {
          id: `mod-${Date.now()}`,
          role: 'model',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        saveChatMessages(selectedCharacter.id, [...updatedMessages, newModelMsg]);
      } else {
        throw new Error(data.error || "Không nhận được phản hồi lịch sử hợp lệ.");
      }
    } catch (err: any) {
      const errorMessageCard: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `⛈️ [Hệ thống Bảo tàng]: Đã có lỗi xảy ra khi truyền tin với danh nhân. Chi tiết: ${err.message || 'Lỗi mạng hoặc API'}`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      saveChatMessages(selectedCharacter.id, [...updatedMessages, errorMessageCard]);
    } finally {
      setIsSending(false);
    }
  };

  // Clear chat
  const clearChatHistory = () => {
    if (!selectedCharacter) return;
    if (window.confirm(`Bạn muốn đặt lại cuộc trò chuyện với ${selectedCharacter.name}?`)) {
      localStorage.removeItem(`vn_history_chat_${selectedCharacter.id}`);
      setChatMessages(getDefaultWelcome(selectedCharacter));
      setAccuracyResult(null);
    }
  };

  // Perform "Kiểm tra độ chính xác" using API
  const handleCheckAccuracy = async (msgContent: string, msgId: string) => {
    if (!selectedCharacter || isCheckingAccuracy) return;
    
    setIsCheckingAccuracy(true);
    setAnalyzingMsgId(msgId);
    setAnalyzingContentText(msgContent);

    try {
      const res = await fetch('/api/check-accuracy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          messageContent: msgContent
        })
      });

      const result = await res.json();
      if (res.ok) {
        setAccuracyResult(result);
        setAccuracyModalOpen(true);
      } else {
        alert("Lỗi kiểm tra lịch sử: " + (result.error || "Không thể thực thi"));
      }
    } catch (err: any) {
      alert("Đã xảy ra lỗi trục trặc kết nối thẩm thư mục: " + err.message);
    } finally {
      setIsCheckingAccuracy(false);
    }
  };

  // Image upload and parse
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImageError(null);
      setImageAnalysis(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        setImageError("Vui lòng chỉ tải lên tệp hình ảnh di tích/hiện vật.");
        return;
      }
      setImageFile(file);
      setImageError(null);
      setImageAnalysis(null);

      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Visual analysis trigger
  const handleAnalyzeImage = async () => {
    if (!selectedImage || isAnalyzingImage) return;

    setIsAnalyzingImage(true);
    setImageError(null);
    setImageAnalysis(null);

    try {
      const res = await fetch('/api/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          mimeType: imageFile?.type || 'image/jpeg'
        })
      });

      const data = await res.json();
      if (res.ok) {
        setImageAnalysis(data);
      } else {
        throw new Error(data.error || "Không thể phân loại di vật dựa trên hình ảnh.");
      }
    } catch (err: any) {
      setImageError(err.message || "Lỗi xử lý hình ảnh.");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Dynamic Lucide matcher
  const renderCharacterIcon = (iconName: string) => {
    const cls = "w-6 h-6 text-yellow-500 shrink-0";
    switch (iconName) {
      case 'Heart': return <Heart className={cls} />;
      case 'ShieldAlert': return <Shield className={cls} />;
      case 'Sword': return <Sword className={cls} />;
      case 'Flower2': return <Flower className={cls} />;
      case 'BookOpen': return <BookOpen className={cls} />;
      case 'Flame': return <Flame className={cls} />;
      default: return <User className={cls} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white">
      {/* Decorative Top Museum Red & Gold Line */}
      <div className="h-2 bg-gradient-to-r from-red-900 via-amber-500 to-red-900 w-full" id="top-decor-bar" />

      {/* Main Header */}
      <header className="border-b border-red-950/60 bg-slate-900/90 backdrop-blur sticky top-0 z-40" id="main-header">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Logo Title */}
          <div 
            onClick={() => { setSelectedCharacter(null); setCurrentTab('home'); }}
            className="flex items-center gap-3 cursor-pointer group"
            id="logo-container"
          >
            <div className="p-2.5 rounded bg-gradient-to-br from-red-800 to-amber-600 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Sword className="w-6 h-6 text-[#f3ca40]" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                BẢO TÀNG LỊCH SỬ VIỆT NAM AI
              </h1>
              <p className="text-xs text-amber-500 tracking-wider uppercase font-medium">Viện Giáo Dục Di Sản Thông Minh</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex items-center gap-2 sm:gap-4 bg-slate-950/80 p-1.5 rounded-lg border border-red-950/50" id="navigation-tabs">
            <button
              onClick={() => { setSelectedCharacter(null); setCurrentTab('home'); }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                currentTab === 'home' && !selectedCharacter
                  ? 'bg-gradient-to-r from-red-800 to-red-900 text-white border border-amber-500/40 shadow-md shadow-red-900/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
              id="nav-home-btn"
            >
              <Home className="w-4 h-4" />
              <span>Danh Nhân AI</span>
            </button>
            <button
              onClick={() => { setSelectedCharacter(null); setCurrentTab('timeline'); }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                currentTab === 'timeline'
                  ? 'bg-gradient-to-r from-red-800 to-red-900 text-white border border-amber-500/40 shadow-md shadow-red-900/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
              id="nav-timeline-btn"
            >
              <Calendar className="w-4 h-4" />
              <span>Dòng Thời Gian</span>
            </button>
            <button
              onClick={() => { setSelectedCharacter(null); setCurrentTab('analyzer'); }}
              className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-2 ${
                currentTab === 'analyzer'
                  ? 'bg-gradient-to-r from-red-800 to-red-900 text-white border border-amber-500/40 shadow-md shadow-red-900/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
              id="nav-analyzer-btn"
            >
              <Camera className="w-4 h-4" />
              <span>Phân Tích Hiện Vật</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6" id="app-main-content">
        
        {/* VIEW 1: DEDICATED CHARACTER CHAT PAGE */}
        {selectedCharacter ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-fade-in" id="character-chat-view">
            
            {/* Sidebar Column: Profile details */}
            <div className="lg:col-span-1 space-y-5" id="chat-sidebar">
              
              {/* Back to Home card */}
              <button 
                onClick={() => setSelectedCharacter(null)}
                className="w-full flex items-center gap-2.5 px-4 py-3 bg-slate-900 hover:bg-red-950/20 text-slate-300 hover:text-amber-400 rounded-lg border border-red-950/40 transition-colors text-sm font-medium"
                id="back-home-button"
              >
                <ArrowLeft className="w-4 h-4 text-amber-500" />
                <span>Quay lại Bảo tàng</span>
              </button>

              {/* Figure Profile Spec Card */}
              <div className="bg-slate-900/90 rounded-xl border border-red-950/60 p-5 space-y-4 shadow-xl" id="figure-profile-details">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${selectedCharacter.avatarGradient} p-4 flex items-center justify-center border border-amber-500/30 mx-auto shadow-md`}>
                  {renderCharacterIcon(selectedCharacter.avatarIcon)}
                </div>
                
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white tracking-tight">{selectedCharacter.name}</h3>
                  <p className="text-xs text-amber-500 font-medium mt-1">{selectedCharacter.period}</p>
                </div>

                <div className="border-t border-red-950/40 pt-4 text-xs text-slate-300 leading-relaxed text-justify">
                  <p className="font-semibold text-amber-500 mb-1">Tiểu sử tóm tắt:</p>
                  {selectedCharacter.bio}
                </div>

                <div className="border-t border-red-950/40 pt-4 space-y-2">
                  <span className="text-xs font-semibold text-amber-500 block">Đề tài trao đổi thảo luận:</span>
                  <div className="flex flex-wrap gap-1.5" id="topic-tags">
                    {selectedCharacter.focusTopics.map((topic, i) => (
                      <button
                        key={i}
                        onClick={() => setInputMessage(`Hỏi về ${topic}`)}
                        className="text-[10px] bg-slate-950 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/40 px-2.5 py-1 rounded transition-colors text-left w-full"
                      >
                        • {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded border border-red-950/30 text-[11px] text-slate-400 space-y-1">
                  <span className="font-semibold text-amber-600 block">⚠️ Nguyên tắc Lịch sử:</span>
                  <p>AI đóng vai nhưng tuyệt đối không bịa đặt sự kiện, không trích dẫn tùy tiện, và tuyên bố không biết về biến cố xảy ra sau khi qua đời ({selectedCharacter.deathYear}).</p>
                </div>
              </div>
            </div>

            {/* Main Chat Workspace Column */}
            <div className="lg:col-span-3 flex flex-col h-[75vh] bg-slate-900/40 rounded-xl border border-red-950/40 overflow-hidden shadow-2xl relative" id="chat-workspace">
              
              {/* Box Header */}
              <div className="bg-slate-900 px-5 py-4 border-b border-red-950/50 flex justify-between items-center" id="chat-box-header">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${selectedCharacter.avatarGradient} animate-pulse`} />
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                      Trò chuyện cùng {selectedCharacter.name}
                      <span className="text-[10px] font-normal px-2 py-0.5 bg-red-950/50 text-amber-400 rounded-full border border-amber-500/20">Mô phỏng AI</span>
                    </h2>
                    <p className="text-[11px] text-slate-400">Giữ vững cốt cách tôn quý - Sử học chuẩn xác chân thực</p>
                  </div>
                </div>

                <button
                  onClick={clearChatHistory}
                  title="Đặt lại cuộc đối thoại"
                  className="p-1 px-2.5 bg-slate-950 hover:bg-slate-800 border border-red-950/40 hover:border-amber-500/40 rounded-md text-xs text-amber-400 flex items-center gap-1.5 transition-all"
                  id="reset-chat-history"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Làm mới</span>
                </button>
              </div>

              {/* Fallback Banner about context safety and integrity */}
              <div className="bg-red-950/20 px-5 py-2.5 border-b border-red-950/30 flex items-center gap-2.5 text-xs text-amber-500">
                <Info className="w-4 h-4 shrink-0 text-amber-500" />
                <p className="leading-tight">
                  Tích hợp kiểm định thông tin 3 chiều nhằm chống sai lệch sử học Việt Nam. Sử dụng nút <strong>"Kiểm tra độ chính xác"</strong> dưới mỗi câu trả lời của AI.
                </p>
              </div>

              {/* Chat Message Scrollport */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4" id="chat-messages-container">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col justify-center items-center text-center text-slate-500 space-y-2">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500/60" />
                    <p className="text-sm">Đang tải cuộc chuyện trò lịch sử...</p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      id={`message-${msg.id}`}
                    >
                      {/* Avatar indicator */}
                      <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border text-xs font-bold ${
                        msg.role === 'user' 
                          ? 'bg-slate-800 border-slate-700 text-slate-300' 
                          : `bg-gradient-to-br ${selectedCharacter.avatarGradient} border-amber-500/20 text-white`
                      }`}>
                        {msg.role === 'user' ? 'Ta' : selectedCharacter.name.slice(0, 2)}
                      </div>

                      {/* Content block */}
                      <div className="space-y-1">
                        <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                          msg.role === 'user'
                            ? 'bg-red-900/60 border border-amber-500/30 text-slate-100 rounded-tr-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none text-justify'
                        }`}>
                          <p className="whitespace-pre-line">{msg.content}</p>
                        </div>
                        
                        {/* Timestamp & Integrity Check bar */}
                        <div className={`flex items-center gap-3 text-[10px] text-slate-400 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <span>{msg.timestamp}</span>
                          
                          {/* Accuracy Check button for AI responses only */}
                          {msg.role === 'model' && msg.id !== 'welcome' && !msg.content.startsWith('⛈️') && (
                            <>
                              <span>•</span>
                              <button
                                onClick={() => handleCheckAccuracy(msg.content, msg.id)}
                                disabled={isCheckingAccuracy}
                                className="text-amber-500 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors disabled:opacity-50"
                                title="Kiểm định xem tuyên bố này có sự thật hay không"
                              >
                                {isCheckingAccuracy && analyzingMsgId === msg.id ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Đang thẩm kiểm...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3 h-3 text-amber-500" />
                                    <span>Kiểm tra độ chính xác</span>
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                {isSending && (
                  <div className="flex gap-3 max-w-[85%] mr-auto items-center" id="ai-loading-indicator">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${selectedCharacter.avatarGradient} flex items-center justify-center text-white font-bold opacity-80 animate-pulse`}>
                      {selectedCharacter.name.slice(0,2)}
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      <span className="text-xs text-slate-400">Danh nhân đang ghi chép thư tịch hồi đáp...</span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input Bar Form */}
              <form onSubmit={handleSendMessage} className="bg-slate-900 p-4 border-t border-red-950/50 flex gap-2" id="chat-input-form">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={`Gửi câu hỏi tế nhị quân sự lịch sử tới ${selectedCharacter.name}...`}
                  maxLength={1000}
                  className="flex-1 bg-slate-950 border border-red-950/60 focus:border-amber-500/70 focus:ring-1 focus:ring-amber-500 rounded-lg px-4 py-3 text-sm placeholder:text-slate-500 outline-none transition-all"
                  id="chat-input-field"
                />
                <button
                  type="submit"
                  disabled={isSending || !inputMessage.trim()}
                  className="px-5 py-3 rounded-lg bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 border border-amber-500/20 text-white font-medium text-sm flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100"
                  id="chat-submit-button"
                >
                  <Send className="w-4 h-4 text-amber-300" />
                  <span className="hidden sm:inline">Vấn An</span>
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* REGULAR VIEWPORT TABS */
          <div className="space-y-10 animate-fade-in" id="regular-tabs-root">
            
            {/* VIEW 2: HOME & CHARACTER CARDS */}
            {currentTab === 'home' && (
              <div className="space-y-10" id="home-view-fragment">
                
                {/* HERO BANNER SECTION */}
                <div 
                  className="relative rounded-2xl overflow-hidden bg-slate-900 border border-red-950/60 py-12 md:py-16 px-6 md:px-12 text-center space-y-6 shadow-2xl"
                  id="museum-hero-banner"
                  style={{
                    backgroundImage: 'radial-gradient(circle at center, rgba(127, 29, 29, 0.15) 0%, rgba(15, 23, 42, 0) 70%)'
                  }}
                >
                  {/* Styled Gold Corners for Museum aesthetic */}
                  <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-amber-500/50" />
                  <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-amber-500/50" />
                  <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-amber-500/50" />
                  <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-amber-500/50" />

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-950/50 border border-amber-500/20 text-xs text-amber-400 font-medium tracking-wide mx-auto" id="hero-badge">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Mô hình ngôn ngữ học sử chuẩn xác cao</span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight" id="hero-title">
                    Bảo Tàng Lịch Sử Việt Nam AI
                  </h1>
                  
                  <p className="text-slate-300 text-sm md:text-lg max-w-3xl mx-auto leading-relaxed font-light" id="hero-subtitle">
                    Trò chuyện cùng các danh nhân lịch sử Việt Nam bằng trí tuệ nhân tạo. Khám phá các trận chiến anh dũng, áng thơ cổ, giáo sách chính thống vô song mà tuyệt đối không lo bịa đặt xuyên tạc sự thật.
                  </p>

                  <div className="flex flex-wrap justify-center gap-4 pt-2" id="hero-action-buttons">
                    <button
                      onClick={() => {
                        const target = document.getElementById('historical-figures-gallery');
                        target?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-6 py-3 rounded-lg bg-gradient-to-r from-red-800 via-red-900 to-amber-700 hover:from-red-700 hover:to-amber-600 border border-amber-500/30 text-white font-semibold text-sm transition-all shadow-lg active:scale-95"
                      id="hero-explore-btn"
                    >
                      Khám phá ngay
                    </button>
                    <button
                      onClick={() => setCurrentTab('timeline')}
                      className="px-6 py-3 rounded-lg bg-slate-950 hover:bg-slate-900 border border-red-950 text-slate-300 hover:text-white font-semibold text-sm transition-all"
                      id="hero-timeline-btn"
                    >
                      Dòng thời gian lịch sử
                    </button>
                  </div>
                </div>

                {/* HIGHLIGHT FACT CHECKS BAR */}
                <div className="bg-slate-900/60 rounded-xl p-5 border border-red-950/40 grid grid-cols-1 md:grid-cols-3 gap-6 text-center" id="facts-highlights-row">
                  <div className="space-y-1">
                    <span className="text-xl font-bold text-amber-500 block">✓ Chân thực 100%</span>
                    <p className="text-xs text-slate-400">Không bịa đặt lời thoại hay sự kiện xảy ra ngoài giáo khoa sử sách quốc gia.</p>
                  </div>
                  <div className="space-y-1 border-t md:border-t-0 md:border-x border-red-950/40 pt-4 md:pt-0">
                    <span className="text-xl font-bold text-amber-500 block">⌛ Trí thức có hạn kỳ</span>
                    <p className="text-xs text-slate-400">Danh nhân tuyệt đối từ chối tự nhận thức trực tiếp sự kiện xảy ra sau thời kỳ tạ thế.</p>
                  </div>
                  <div className="space-y-1 border-t md:border-t-0 pt-4 md:pt-0">
                    <span className="text-xl font-bold text-amber-500 block">🛡️ Kiểm định khoa học</span>
                    <p className="text-xs text-slate-400">Tách biệt rõ ràng huyền sử, thần tích và quan điểm tranh luận sử học.</p>
                  </div>
                </div>

                {/* GALLERY TITLE HEADER */}
                <div className="space-y-2 text-center" id="gallery-header">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
                    <Sword className="w-5 h-5 text-amber-500" />
                    <span>LỰA CHỌN DANH NHÂN DI SẢN</span>
                  </h2>
                  <p className="text-sm text-slate-400 max-w-xl mx-auto">Chọn một danh nhân vĩ đại dưới đây để bước vào thế giới đối ẩm, thấu hiểu tư duy hào kiệt Đại Việt.</p>
                </div>

                {/* CHARACTER GALLERY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="historical-figures-gallery">
                  {CHARACTERS.map((char) => (
                    <div 
                      key={char.id}
                      className="bg-slate-900 hover:bg-slate-900/95 rounded-xl border border-red-950/60 hover:border-amber-500/40 p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-md hover:shadow-red-950/20 group"
                      id={`figure-card-${char.id}`}
                    >
                      <div className="space-y-4">
                        {/* Upper row: Avatar & Period stamp */}
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${char.avatarGradient} p-3 flex items-center justify-center border border-amber-500/20 shadow-inner group-hover:scale-105 transition-transform`}>
                            {renderCharacterIcon(char.avatarIcon)}
                          </div>
                          <div>
                            <span className="text-[10px] text-amber-500 uppercase tracking-wider font-semibold block">{char.period}</span>
                            <h3 className="text-lg font-bold text-white tracking-tight">{char.name}</h3>
                          </div>
                        </div>

                        {/* Title of respect */}
                        <span className="text-xs font-semibold text-amber-600 block">{char.title}</span>

                        {/* Bio paragraph description */}
                        <p className="text-xs text-slate-300 leading-relaxed text-justify line-clamp-4">
                          {char.bio}
                        </p>
                      </div>

                      {/* Card Lower button click to chat */}
                      <div className="mt-5 pt-4 border-t border-red-950/40">
                        <button
                          onClick={() => setSelectedCharacter(char)}
                          className="w-full py-2.5 px-4 bg-gradient-to-r from-red-950/60 to-red-900/40 hover:from-red-900 hover:to-amber-800 text-slate-200 hover:text-white rounded-lg border border-red-950 hover:border-amber-500/30 text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 transition-all"
                          id={`chat-btn-${char.id}`}
                        >
                          <MessageSquare className="w-4 h-4 text-amber-500" />
                          <span>Hội Kiến & Trò Chuyện</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* VIEW 3: INTERACTIVE HISTORICAL TIMELINE */}
            {currentTab === 'timeline' && (
              <div className="space-y-6 animate-fade-in" id="timeline-view-fragment">
                
                {/* Header text info banner */}
                <div className="bg-slate-900 rounded-xl p-6 border border-red-950/40 text-center space-y-2">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">Biên Niên Sử Hào Hùng Việt Nam</h2>
                  <p className="text-xs text-slate-400 max-w-2xl mx-auto">
                    Kính mời quý độc giả nhấp vào từng dấu mốc lịch sử bên dưới để hiển thị bản tóm tắt học thuật đầy đủ, ý nghĩa quốc bảo vĩ đại, cùng các tài liệu quy chuẩn tham khảo khách quan từ viện sử học.
                  </p>
                </div>

                {/* Vertical interactive timeline body layout */}
                <div className="relative border-l border-red-900/50 max-w-4xl mx-auto pl-6 sm:pl-8 py-5 space-y-12" id="timeline-rail">
                  {TIMELINE_EVENTS.map((evt) => (
                    <div 
                      key={evt.year} 
                      className="relative md:grid md:grid-cols-5 gap-6 group cursor-pointer"
                      onClick={() => setSelectedTimelineEvent(evt)}
                      id={`timeline-node-${evt.year}`}
                    >
                      {/* Circle Dot with specific year highlighting */}
                      <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-5 h-5 rounded-full bg-slate-950 border-4 border-amber-500 group-hover:scale-125 transition-transform z-10" />

                      {/* Year badge label */}
                      <div className="md:col-span-1">
                        <span className="text-2xl font-black text-amber-500 tracking-tight block">
                          Năm {evt.year}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider mt-0.5">
                          {evt.period}
                        </span>
                      </div>

                      {/* Short excerpt Card block */}
                      <div className="md:col-span-4 mt-2 md:mt-0 bg-slate-900/90 border border-red-950 hover:border-amber-500/40 p-5 rounded-xl transition-all shadow-md group-hover:bg-slate-900 duration-200">
                        <div className="flex justify-between items-start gap-4">
                          <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                            {evt.title}
                          </h3>
                          <span className="text-[10px] bg-red-950 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium shrink-0">
                            Khám cứu di cảo
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-2.5 leading-relaxed text-justify">
                          {evt.description.slice(0, 180)}... <span className="text-amber-500 hover:underline">Xem đầy đủ ý nghĩa di tích và nguồn sử.</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* VIEW 4: HISTORICAL IMAGE ANALYZER */}
            {currentTab === 'analyzer' && (
              <div className="space-y-6 animate-fade-in" id="analyzer-view-fragment">
                
                {/* Prompt instructions section banner */}
                <div className="bg-slate-900 rounded-xl p-6 border border-red-950/40 space-y-2">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
                    <Camera className="w-6 h-6 text-yellow-500" />
                    <span>Thiết Bị Giám Định Di Sản Lịch Sử AI</span>
                  </h2>
                  <p className="text-xs text-slate-400 max-w-2xl mx-auto text-center">
                    Tải lên hình ảnh địa danh, di tích quốc gia hay tài liệu cổ vật viễn chinh (Ví dụ: Lăng Bác, Văn Miếu, Dinh Độc Lập, Hoàng thành Thăng Long...). Trí tuệ nhân tập của chúng tôi sẽ tận tụy trích lục thời kỳ lịch sử, nguồn tài nguyên văn hiến và phân loại độ tin cậy.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="analyzer-grid">
                  
                  {/* Upload panel card wrapper */}
                  <div className="bg-slate-900 border border-red-950/60 rounded-xl p-5 sm:p-6 space-y-5" id="upload-panel-container">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">Bước 1: Tải ảnh hiện vật / di chỉ</span>
                    
                    {/* Visual drag drop box wrapper */}
                    <div 
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => document.getElementById('visual-file-picker')?.click()}
                      className="border-2 border-dashed border-red-950/80 hover:border-amber-500/50 bg-slate-950/60 rounded-xl p-8 text-center cursor-pointer transition-all space-y-4"
                      id="drag-drop-viewport"
                    >
                      <input 
                        type="file" 
                        id="visual-file-picker" 
                        accept="image/*" 
                        onChange={handleImageChange}
                        className="hidden" 
                      />

                      {selectedImage ? (
                        <div className="space-y-3" id="preview-image-block">
                          <img 
                            src={selectedImage} 
                            alt="Preview di sản tải lên" 
                            className="max-h-56 mx-auto rounded-lg object-contain border border-red-950" 
                          />
                          <p className="text-[11px] text-slate-400">Tên file hình ảnh hoặc hiện vật đã sẵn sàng</p>
                        </div>
                      ) : (
                        <div className="space-y-3 py-6" id="empty-upload-block">
                          <div className="w-12 h-12 rounded-full bg-red-950/40 flex items-center justify-center mx-auto text-amber-400 border border-amber-500/25">
                            <Upload className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">Nhấp chuột để chọn ảnh hoặc thả file vào đây</p>
                            <p className="text-xs text-slate-400 mt-1">Phục vụ các định dạng tiêu chuẩn: PNG, JPG, WEBP dung lượng tối đa 10MB</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Instruction Quick Shortcuts Samples */}
                    <div className="space-y-2 border-t border-red-950/40 pt-4" id="sample-quick-pick">
                      <span className="text-xs text-slate-400">Để kiểm tra thử nghiệm, bạn có thể chọn các di tích mẫu hoặc tải trực tiếp ảnh riêng:</span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: 'Văn Miếu Quốc Tử Giám', url: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=500&auto=format&fit=crop&q=60' },
                          { name: 'Dinh Độc Lập', url: 'https://images.unsplash.com/photo-1599508704512-2f19efd1e35f?w=500&auto=format&fit=crop&q=60' },
                          { name: 'Hoàng Thành Thăng Long', url: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=500&auto=format&fit=crop&q=60' }
                        ].map((sample) => (
                          <button
                            key={sample.name}
                            onClick={() => {
                              setSelectedImage(sample.url);
                              setImageFile(null);
                              setImageAnalysis(null);
                              setImageError(null);
                            }}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-red-950 hover:border-amber-500/30 rounded text-xs text-slate-300 transition-all"
                          >
                            🖼️ {sample.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Analyze Action trigger */}
                    <button
                      onClick={handleAnalyzeImage}
                      disabled={!selectedImage || isAnalyzingImage}
                      className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-600 disabled:opacity-50 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95"
                      id="analyze-image-submit"
                    >
                      {isAnalyzingImage ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                          <span>Đang giám định di sản với trí tuệ Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 text-amber-300" />
                          <span>Giám Định & Phân Tích Hình Ảnh</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Analysis Result Output Box */}
                  <div className="bg-slate-900 border border-red-950/60 rounded-xl p-5 sm:p-6 flex flex-col justify-between" id="analysis-result-container">
                    <div className="space-y-4">
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">Bước 2: Kết quả giám định học thuật</span>

                      {imageError && (
                        <div className="p-4 rounded-lg bg-red-950/40 border border-red-700/40 text-red-400 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <p>{imageError}</p>
                        </div>
                      )}

                      {imageAnalysis ? (
                        <div className="space-y-4 animate-fade-in" id="analysis-success-block">
                          {/* Top metadata tags */}
                          <div className="flex flex-wrap justify-between items-center gap-3 bg-slate-950 p-4 rounded-lg border border-red-950/40">
                            <div>
                              <span className="text-xs text-slate-400 block">Địa danh/Hiện vật di tích:</span>
                              <span className="text-base font-bold text-white">{imageAnalysis.siteName}</span>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block p-0.5">Thời kỳ tương ứng:</span>
                              <span className="text-xs font-semibold px-2.5 py-1 bg-red-950/80 text-amber-400 rounded-md border border-amber-500/20">{imageAnalysis.period}</span>
                            </div>
                          </div>

                          {/* Confidence Indicator Tag */}
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Mức độ tự tin sử lý học:</span>
                            {imageAnalysis.confidence === 'high' ? (
                              <span className="px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/20 text-xs flex items-center gap-1.5 font-semibold">
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>Độ chuẩn xác Cao (Đã kiểm chứng di tích)</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-500/20 text-xs flex items-center gap-1.5 font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Mơ hồ / Tự tin Thấp (Cần bổ sung tài liệu)</span>
                              </span>
                            )}
                          </div>

                          {/* Historical Significance detailed display */}
                          <div className="space-y-1.5 pt-2">
                            <span className="text-xs font-semibold text-amber-500 block">Ý nghĩa lịch sử tiêu biểu:</span>
                            <p className="text-xs text-slate-200 leading-relaxed text-justify bg-slate-950/50 p-3.5 rounded border border-slate-800">
                              {imageAnalysis.significance}
                            </p>
                          </div>

                          {/* Detailed Explanation */}
                          <div className="space-y-1.5">
                            <span className="text-xs font-semibold text-amber-500 block">Biên khảo chi tiết của Chuyên gia:</span>
                            <p className="text-xs text-slate-300 leading-relaxed text-justify bg-slate-950/30 p-3.5 rounded border border-red-950/20">
                              {imageAnalysis.explanation}
                            </p>
                          </div>
                        </div>
                      ) : (
                        !isAnalyzingImage && !imageError && (
                          <div className="h-48 flex flex-col justify-center items-center text-center text-slate-500 space-y-2 border-2 border-dotted border-slate-800 rounded-xl" id="analyzer-results-placeholder">
                            <Sparkles className="w-6 h-6 text-slate-700" />
                            <p className="text-xs max-w-sm">Chưa có kết quả giám định di cảo. Vui lòng chọn ảnh ở phần Bước 1 và nhấn nút "Giám Định & Phân Tích Hình Ảnh".</p>
                          </div>
                        )
                      )}

                      {isAnalyzingImage && (
                        <div className="py-20 flex flex-col justify-center items-center text-center text-slate-400 space-y-3" id="vision-analysis-progress">
                          <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
                          <div>
                            <p className="text-sm font-semibold text-white">Đang thực thi nhận diện địa danh học...</p>
                            <p className="text-xs text-slate-400">Gemini đang rà soát sử thư triều Đại Việt và tư liệu văn hóa học</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-red-950/30 pt-4 mt-6 text-[10px] text-slate-500" id="analyzer-caution-disclaimer">
                      * Thiết bị phân tích hình ảnh tuân thủ nghiêm ngặt nguyên lý dẹp bỏ ảo mộng ngôn ngữ học từ AI, chỉ trình bày thông số có căn cứ sử học rõ ràng hoặc báo cáo độ tin thấp tương thục lý.
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* FOOTER CO-AUTHOR CREDIT */}
      <footer className="border-t border-red-950/60 bg-slate-950 py-8 px-4" id="main-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <div className="space-y-1">
            <span className="text-sm font-extrabold text-[#f3ca40] tracking-wide">BẢO TÀNG LỊCH SỬ VIỆT NAM AI</span>
            <p className="text-xs text-slate-400 max-w-lg">
              Chương trình bảo tồn di sản giáo dục quốc gia tích hợp Trí Tuệ Nhân Tạo. Nghiêm chỉnh tuân thủ tính trung thực, cự tuyệt hư cấu ngụy tạo truyền thần thuyết sử học Việt Nam.
            </p>
          </div>
          <div className="text-xs text-slate-400 space-y-1">
            <p>© 2026 Viện Nghiên Cứu & Trải Nghiệm Sử Việt Thông Minh</p>
            <p className="flex items-center justify-center md:justify-end gap-1.5 text-amber-500 text-[10px] font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>Chạy thử nghiệm trên hệ sinh thái Google AI Studio</span>
            </p>
          </div>
        </div>
      </footer>

      {/* TIMELINE EVENT VIEW MODAL */}
      {selectedTimelineEvent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="timeline-modal-overlay">
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col" id="timeline-modal-box">
            
            {/* Modal cover image container */}
            <div className="relative h-48 w-full bg-slate-800" id="timeline-modal-cover">
              <img 
                src={selectedTimelineEvent.images} 
                alt={selectedTimelineEvent.title} 
                className="w-full h-full object-cover opacity-80" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <button 
                onClick={() => setSelectedTimelineEvent(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 text-slate-300 hover:text-white border border-red-950 transition-colors"
                title="Đóng bảng"
                id="close-timeline-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="absolute bottom-4 left-5 pr-5">
                <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider block">{selectedTimelineEvent.period}</span>
                <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">{selectedTimelineEvent.title}</h3>
              </div>
            </div>

            {/* Scrollable contents body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-sm bg-slate-900/90" id="timeline-modal-body">
              
              <div className="space-y-1">
                <span className="text-xs font-semibold text-amber-500 tracking-wider block uppercase">Niên đại:</span>
                <span className="text-lg font-black text-white block">Năm {selectedTimelineEvent.year}</span>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-red-950/40">
                <span className="text-xs font-semibold text-amber-500 block">Mô tả sự kiện:</span>
                <p className="text-xs text-slate-300 leading-relaxed text-justify">
                  {selectedTimelineEvent.description}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-red-950/40">
                <span className="text-xs font-semibold text-amber-500 block">Ý nghĩa & Tầm vóc lịch sử:</span>
                <p className="text-xs text-slate-200 leading-relaxed text-justify bg-slate-950/50 p-3 rounded border border-slate-800">
                  {selectedTimelineEvent.significance}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-red-950/40">
                <span className="text-xs font-semibold text-amber-500 block">Tư liệu tham chiếu học thuật chí chính:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedTimelineEvent.references.map((item, index) => (
                    <span 
                      key={index} 
                      className="px-2.5 py-1 text-[11px] bg-slate-950 text-slate-300 border border-slate-800 rounded flex items-center gap-1 font-medium"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Related historical characters suggestions row */}
              <div className="pt-4 border-t border-red-950/40 space-y-2">
                <span className="text-xs font-semibold text-slate-400 block">Sự kiện này liên quan mật thiết tới danh nhân:</span>
                <div className="flex flex-wrap gap-2">
                  {CHARACTERS.filter(char => {
                    if (selectedTimelineEvent.year === 1945 && char.id === 'hcm') return true;
                    if (selectedTimelineEvent.year === 1954 && char.id === 'vng') return true;
                    if (selectedTimelineEvent.year === 1288 && char.id === 'thd') return true;
                    if (selectedTimelineEvent.year === 1428 && char.id === 'nt') return true;
                    if (selectedTimelineEvent.year === 1789 && char.id === 'qt') return true;
                    return false;
                  }).map(char => (
                    <button
                      key={char.id}
                      onClick={() => {
                        setSelectedTimelineEvent(null);
                        setSelectedCharacter(char);
                      }}
                      className="px-3.5 py-2 bg-gradient-to-r from-red-950/80 to-red-900/60 hover:from-red-900 text-slate-200 hover:text-white border border-red-950 hover:border-amber-500/30 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-md"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                      <span>Tham vấn {char.name} hữu nghị</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Down buttons row */}
            <div className="p-4 bg-slate-950 border-t border-red-950/50 flex justify-end" id="timeline-modal-footer">
              <button 
                onClick={() => setSelectedTimelineEvent(null)}
                className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white font-medium transition-all"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ACCURACY ACCORDION VIEW DIALOG MODAL */}
      {accuracyModalOpen && accuracyResult && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="accuracy-modal-overlay">
          <div className="bg-slate-900 border border-amber-500/30 rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col" id="accuracy-modal-box">
            
            {/* Modal Header banner */}
            <div className="bg-gradient-to-r from-red-950 via-slate-900 to-red-950 p-5 border-b border-red-950/50 flex justify-between items-center" id="accuracy-modal-header">
              <div className="flex items-center gap-2.5">
                <BadgeAlert className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-white">Kết Quả Giám Định & Thẩm Định Lịch Sử</h3>
                  <p className="text-[10px] text-slate-400">Kiểm thử đa chiều độ trung thực của câu trả lời AI vừa phát sinh</p>
                </div>
              </div>
              <button 
                onClick={() => { setAccuracyModalOpen(false); setAccuracyResult(null); }}
                className="p-1 px-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white rounded"
                title="Đóng bảng thẩm định"
                id="close-accuracy-modal-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable contents flow */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm bg-slate-900" id="accuracy-modal-body">
              
              {/* Question excerpt being verified */}
              <div className="bg-slate-950 p-3.5 rounded border border-red-950/20 space-y-1" id="analyzing-excerpt-view">
                <span className="text-[10px] text-amber-500 font-semibold uppercase tracking-wider block">Nội dung trích lục thẩm định:</span>
                <p className="text-xs text-slate-300 italic max-h-24 overflow-y-auto leading-relaxed">
                  "{analyzingContentText}"
                </p>
              </div>

              {/* Three Dimensions display split */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="accuracy-three-dimensions">
                
                {/* 1. Facts */}
                <div className="bg-slate-950/60 p-4 rounded-lg border border-emerald-950/60 hover:border-emerald-500/20 transition-all space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Lịch Sử Thực Tế</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed text-justify">
                    {accuracyResult.fact || 'Không phát hiện tư liệu thực tế bổ trợ bổ trợ đặc trưng.'}
                  </p>
                </div>

                {/* 2. Interpretation */}
                <div className="bg-slate-950/60 p-4 rounded-lg border border-indigo-950/60 hover:border-indigo-500/20 transition-all space-y-2">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <Info className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Góc Nhìn / Diễn Giải</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed text-justify">
                    {accuracyResult.interpretation || 'Không ghi nhận góc nhìn chủ quan hay sắc dụ văn học.'}
                  </p>
                </div>

                {/* 3. Unverified/Undebated */}
                <div className="bg-slate-950/60 p-4 rounded-lg border border-amber-950/60 hover:border-amber-500/20 transition-all space-y-2">
                  <div className="flex items-center gap-2 text-amber-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-wider">Huyền Thoại / Chưa Chứng</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed text-justify">
                    {accuracyResult.unverified || 'Không phát hiện các thông tin hay huyền kỷ nằm ngoài sử học.'}
                  </p>
                </div>

              </div>

              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400 leading-relaxed text-justify" id="accuracy-philosophy">
                <span className="font-semibold text-amber-500 block mb-1">💡 Tuyên Ngôn Thẩm Định:</span>
                "Tầm quan trọng chí tử của một Nền giáo dục Lịch sử học chính nghĩa và kiên tinh là phân biệt rạch ròi giữa Sử Thần kịch, truyền thuyết văn học với Biên niên ký thực chứng đã được lưu chép khoa học chính tông."
              </div>

            </div>

            {/* Modal action button row */}
            <div className="p-4 bg-slate-950 border-t border-red-950/50 flex justify-end" id="accuracy-modal-footer">
              <button 
                onClick={() => { setAccuracyModalOpen(false); setAccuracyResult(null); }}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-red-900 to-amber-800 text-xs text-white hover:text-white font-semibold transition-all border border-amber-500/20"
              >
                Đồng ý thông điệp
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
