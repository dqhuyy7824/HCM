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
                          { name: 'Văn Miếu Quốc Tử Giám', url: 'data:image/jpeg;base64,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' },
                          { name: 'Dinh Độc Lập', url: 'data:image/jpeg;base64,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' },
                          { name: 'Hoàng Thành Thăng Long', url: 'data:image/jpeg;base64,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' }
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
