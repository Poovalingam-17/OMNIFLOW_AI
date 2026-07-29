import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Send, Paperclip, Mic, Bot, User, Menu, ChevronLeft, Plus, MessageSquare, Sparkles, Database, FileText, X, Trash2, Search, Copy, Check } from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { fetchAgents } from '../store/agentSlice';
import Navbar from '../components/common/Navbar';
import { 
  createConversation, 
  sendMessageStream, 
  fetchConversations, 
  fetchMessages,
  selectConversation,
  clearMessages,
  addLocalMessage,
  setStreaming,
  deleteConversation
} from '../store/chatSlice';
import { getDocuments, queryDocument, Document } from '../api/documentApi';
import DocumentUpload from '../components/documents/DocumentUpload';
import toast from 'react-hot-toast';

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    toast.success('Copied code block');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-105 border-b border-slate-200 text-xs font-semibold text-slate-500">
        <span className="uppercase tracking-wider text-[10px]">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 hover:text-slate-800 transition cursor-pointer text-slate-450"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600 animate-fade-in" />
              <span className="text-emerald-600 text-[10px]">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[10px]">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 bg-slate-950 text-slate-150 font-mono text-xs overflow-x-auto text-left leading-relaxed">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};

const FormattedMessage: React.FC<{ content: string }> = ({ content }) => {
  if (!content.includes('```')) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  const parts = content.split('```');
  return (
    <div className="space-y-1">
      {parts.map((part, index) => {
        const isCode = index % 2 === 1;
        if (isCode) {
          const firstLineIndex = part.indexOf('\n');
          let language = '';
          let code = part;
          if (firstLineIndex !== -1) {
            language = part.substring(0, firstLineIndex).trim();
            code = part.substring(firstLineIndex + 1);
          }
          return <CodeBlock key={index} language={language} code={code} />;
        } else {
          return <p key={index} className="whitespace-pre-wrap inline-block w-full">{part}</p>;
        }
      })}
    </div>
  );
};

const ChatPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  
  const { agents } = useSelector((state: RootState) => state.agents);
  const { 
    currentConversation, 
    messages, 
    conversations, 
    isStreaming 
  } = useSelector((state: RootState) => state.chat);

  const [input, setInput] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(
    location.state?.agentId || null
  );
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // RAG States
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  // Image Attachment States
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are supported as input.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast.error('Voice input is not supported in this browser. Try Chrome or Safari.');
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscript = '';

      recognition.onstart = () => {
        setIsListening(true);
        toast.success('Listening... Click mic to stop and send.');
      };

      recognition.onend = () => {
        setIsListening(false);
        if (finalTranscript.trim()) {
          handleSendMessage(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone permission is required.');
        } else if (event.error !== 'no-speech') {
          toast.error('Voice input failed: ' + event.error);
        }
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let tempFinal = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            tempFinal += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (tempFinal) {
          finalTranscript += tempFinal;
        }
        setInput((finalTranscript + interimTranscript).trim());
      };

      recognitionRef.current = recognition;
      recognition.start();
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents', err);
    }
  };

  useEffect(() => {
    dispatch(fetchAgents());
    dispatch(fetchConversations()).finally(() => {
      setConversationsLoaded(true);
    });
    loadDocuments();
  }, [dispatch]);

  useEffect(() => {
    if (selectedAgentId && conversationsLoaded) {
      const activeConv = conversations.find(c => c.agent.id === selectedAgentId && c.status === 'ACTIVE');
      if (activeConv) {
        dispatch(selectConversation(activeConv.id));
      } else {
        dispatch(createConversation({ agentId: selectedAgentId, title: 'New Orchestration' }));
      }
    }
  }, [selectedAgentId, conversationsLoaded, conversations, dispatch]);

  useEffect(() => {
    if (currentConversation?.id) {
      dispatch(fetchMessages(currentConversation.id));
    }
  }, [currentConversation?.id, dispatch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSendMessage = async (overrideText?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : input;
    if (!textToSend.trim()) return;
    const txt = textToSend;
    setInput('');

    if (selectedDocumentId) {
      dispatch(addLocalMessage({ senderType: 'USER', content: txt }));
      dispatch(setStreaming(true));
      
      try {
        const response = await queryDocument(selectedDocumentId, txt);
        dispatch(addLocalMessage({
          senderType: 'AGENT',
          content: response.answer,
          isRag: true,
          sources: response.sources.map(s => s.content).slice(0, 2).join('\n\n')
        }));
      } catch (error) {
        toast.error('RAG query failed.');
        dispatch(addLocalMessage({
          senderType: 'AGENT',
          content: 'Failed to process RAG request. Please check document status or try again.'
        }));
      } finally {
        dispatch(setStreaming(false));
      }
    } else {
      if (!currentConversation?.id) {
        toast.error('Select an orchestrator or document first.');
        return;
      }
      const isFirstMessage = currentConversation.messageCount === 0;
      const result = await dispatch(sendMessageStream({ 
        conversationId: currentConversation.id, 
        content: txt,
        imageBase64: selectedImage || undefined
      }));
      setSelectedImage(null);
      if (sendMessageStream.rejected.match(result)) {
        toast.error('Failed to get response from agent.');
      } else if (isFirstMessage) {
        // Refresh conversations to get the auto-generated title
        dispatch(fetchConversations());
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startNewSession = () => {
    setSelectedAgentId(null);
    dispatch(clearMessages());
    toast.success('Select an agent from the dropdown to start.');
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this conversation session? All message history will be permanently lost.')) {
      return;
    }
    try {
      const result = await dispatch(deleteConversation(conversationId));
      if (deleteConversation.fulfilled.match(result)) {
        toast.success('Conversation deleted.');
      } else {
        toast.error('Failed to delete conversation.');
      }
    } catch (err) {
      toast.error('Failed to delete conversation.');
    }
  };
 
  const filteredConversations = conversations.filter(conv => 
    (conv.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (conv.agent?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden font-sans">
      <Navbar />
 
      <div className="flex-1 flex overflow-hidden relative">
        <aside className={`${isSidebarOpen ? 'w-80 border-r border-slate-200/80 bg-white' : 'w-0 border-r-0'} transition-all duration-300 flex flex-col overflow-hidden relative z-20`}>
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 tracking-wide text-xs uppercase flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <span>Conversations</span>
            </h2>
            <button 
              onClick={startNewSession}
              className="p-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer"
              title="New Conversation"
            >
              <Plus className="w-4 h-4 text-primary" />
            </button>
          </div>

          <div className="p-3 border-b border-slate-200/60 bg-slate-50/40">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition duration-150"
              />
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-650 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
 
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {conversations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No conversation history found</p>
            ) : filteredConversations.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No matching conversations</p>
            ) : (
              filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`p-3.5 rounded-xl cursor-pointer border transition-all duration-200 text-left relative group ${
                    currentConversation?.id === conv.id 
                      ? 'bg-primary/5 border-primary/15 text-primary shadow-sm' 
                      : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200/60'
                  }`}
                  onClick={() => {
                    setSelectedAgentId(conv.agent.id);
                    dispatch(selectConversation(conv.id));
                  }}
                >
                  <p className={`font-semibold text-sm truncate pr-8 ${
                    currentConversation?.id === conv.id ? 'text-primary' : 'text-slate-700'
                  }`}>
                    {conv.title || 'Untitled Session'}
                  </p>
                  <button 
                    onClick={(e) => handleDeleteConversation(e, conv.id)}
                    className="absolute right-3 top-3 p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 transition opacity-0 group-hover:opacity-100 cursor-pointer z-10"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-[10px] uppercase tracking-wider font-semibold ${
                      currentConversation?.id === conv.id ? 'text-primary/80' : 'text-slate-400'
                    }`}>
                      {conv.agent.name}
                    </span>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {new Date(conv.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          <div className="bg-white border-b border-slate-200/85 p-4 flex items-center justify-between shadow-sm relative z-10 animate-fade-in">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="text-left">
                <h2 className="font-bold text-slate-800 flex items-center space-x-2">
                  <span>{currentConversation?.title || currentConversation?.agent?.name || 'Select an Agent'}</span>
                  {currentConversation && (
                    <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
                  )}
                </h2>
                <p className="text-xs text-slate-400">
                  {currentConversation ? `${currentConversation.agent.name} • ${currentConversation.agent.domain}` : 'Awaiting agent selection'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition cursor-pointer"
                value={selectedAgentId || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedAgentId(val ? Number(val) : null);
                }}
              >
                <option value="">Select Agent</option>
                {agents.filter(a => a.isActive).map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>

              <button 
                onClick={() => setIsDocModalOpen(true)}
                className="flex items-center space-x-1.5 text-xs text-slate-650 hover:text-slate-800 font-semibold px-3 py-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <FileText className="w-4 h-4 text-primary" />
                <span>Documents</span>
              </button>

              <button 
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-1.5 text-xs text-slate-500 hover:text-slate-700 font-semibold px-3 py-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10">
            {messages.length === 0 && !isStreaming ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center text-primary">
                  <Bot className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700">Start a new dialogue</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Select an orchestrator agent from the dropdown at the top right to start a secure orchestration session.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.senderType === 'USER';
                return (
                  <div
                    key={index}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                  >
                    <div className={`max-w-[75%] flex space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        isUser 
                          ? 'bg-slate-900 border-slate-800 text-cyan-400' 
                          : 'bg-primary/10 border-primary/20 text-primary'
                      }`}>
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      <div className="space-y-1">
                        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed text-left ${
                          isUser 
                            ? 'bg-btn-gradient text-white shadow-md shadow-primary/10 rounded-tr-none' 
                            : 'bg-white border border-slate-200/80 text-slate-800 shadow-sm rounded-tl-none'
                        }`}>
                          <FormattedMessage content={msg.content} />
                          
                          {!isUser && msg.isRag && msg.sources && (
                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center space-x-1.5 text-[10px] text-slate-400">
                              <Database className="w-3 h-3 text-primary" />
                              <span className="font-semibold">Sources: {msg.sources}</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold tracking-wider text-left">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {isStreaming && (
              <div className="flex justify-start animate-fade-in">
                <div className="flex space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl px-4 py-3 rounded-tl-none">
                    <div className="flex items-center space-x-1.5 h-4">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* RAG selector */}
          <div className="bg-white border-t border-slate-200/80 p-3 flex items-center justify-between relative z-10 shadow-inner">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-primary" />
              <select
                value={selectedDocumentId || ''}
                onChange={(e) => setSelectedDocumentId(e.target.value ? Number(e.target.value) : null)}
                className="bg-transparent border-0 text-xs text-slate-500 focus:ring-0 focus:outline-none cursor-pointer max-w-[200px] sm:max-w-xs font-semibold"
              >
                <option value="" className="bg-white text-slate-400">LLM Orchestrator mode (No RAG doc)</option>
                {documents.filter(d => d.status === 'COMPLETED').map((doc) => (
                  <option key={doc.id} value={doc.id} className="bg-white text-slate-700">
                    RAG doc: {doc.fileName}
                  </option>
                ))}
              </select>
            </div>
            {selectedDocumentId && (
              <span className="text-[10px] text-primary bg-primary/5 border border-primary/10 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider animate-pulse">
                RAG Active
              </span>
            )}
          </div>

          <div className="bg-white border-t border-slate-200/80 p-4 relative z-10">
            {selectedImage && (
              <div className="max-w-4xl mx-auto mb-3 flex items-center space-x-3 bg-slate-50 border border-slate-200 p-2 rounded-xl">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                  <img src={selectedImage} alt="Attachment Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="absolute top-0.5 right-0.5 bg-rose-600 hover:bg-rose-500 text-white rounded-full p-0.5 shadow transition cursor-pointer z-10"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-700">Image attachment ready</p>
                  <p className="text-[10px] text-slate-400 font-medium">Will be sent to the Gemini orchestrator agent</p>
                </div>
              </div>
            )}

            <div className="max-w-4xl mx-auto flex items-end space-x-2 bg-slate-50 border border-slate-200 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 p-2 rounded-2xl transition duration-150">
              <input
                type="file"
                ref={imageInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
              <button 
                onClick={() => imageInputRef.current?.click()}
                className="p-2 hover:bg-slate-200/40 rounded-xl transition text-slate-400 hover:text-slate-650 cursor-pointer"
                title="Attach Image"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button 
                onClick={toggleListening}
                disabled={!selectedAgentId && !selectedDocumentId}
                className={`p-2 rounded-xl transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none ${
                  isListening 
                    ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20' 
                    : 'text-slate-400 hover:text-slate-650 hover:bg-slate-200/40'
                }`}
                title={isListening ? "Stop Listening" : "Voice Input"}
              >
                <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse text-rose-500' : ''}`} />
              </button>

              <div className="flex-1 min-h-[40px] flex items-center">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={selectedAgentId || selectedDocumentId ? "Type a prompt..." : "Select an orchestrator or document first..."}
                  rows={1}
                  className="w-full bg-transparent border-0 focus:ring-0 text-slate-800 placeholder-slate-400 text-sm focus:outline-none resize-none max-h-24 py-1"
                  disabled={!selectedAgentId && !selectedDocumentId}
                />
              </div>

              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || (!selectedAgentId && !selectedDocumentId) || isStreaming}
                className="bg-btn-gradient hover:opacity-95 text-white p-2.5 rounded-xl transition disabled:opacity-30 disabled:pointer-events-none active:scale-95 shadow-md shadow-primary/10 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Document Upload Modal */}
      {isDocModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg shadow-2xl relative animate-slide-up">
            <DocumentUpload 
              onUploadComplete={() => {
                loadDocuments();
                setIsDocModalOpen(false);
              }} 
              onClose={() => setIsDocModalOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
