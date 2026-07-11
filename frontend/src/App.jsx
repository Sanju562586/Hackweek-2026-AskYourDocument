import { useState, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  MessageSquare,
  Trash2,
  Send,
  CheckCircle,
  AlertCircle,
  X,
  FileSearch,
  Database,
  BarChart2,
  Command
} from 'lucide-react';
import { uploadDocument, queryDocuments, getDocuments, deleteDocument, clearAllDocuments, loadSampleDocument } from './services/api';
import axios from 'axios';

function App() {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ document_count: 0, total_chunks: 0, total_queries: 0, provider: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [question, setQuestion] = useState('');
  const [querying, setQuerying] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [toasts, setToasts] = useState([]);
  
  const messagesEndRef = useRef(null);

  const MAX_CHARS = 500;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, querying]);

  useEffect(() => {
    loadDocuments();
    fetchStats();
  }, []);

  const addToast = (message, type = 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats', err);
    }
  };

  const loadDocuments = async () => {
    try {
      const docs = await getDocuments();
      setDocuments(docs);
      const totalPages = Math.ceil(docs.length / 5);
      if (docs.length === 0) {
        setCurrentPage(1);
      } else if (currentPage > totalPages) {
        setCurrentPage(totalPages || 1);
      }
      fetchStats();
    } catch (err) {
      console.error('Error loading documents:', err);
      addToast('Failed to load documents');
    }
  };

  const onDrop = async (acceptedFiles) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      let uploadFinished = false;

      setUploadProgress(prev => ({
        ...prev,
        [file.name]: { stage: 'chunking', status: 'processing', progress: 15 }
      }));

      const uploadPromise = uploadDocument(file)
        .then(res => {
          uploadFinished = true;
          return res;
        })
        .catch(err => {
          uploadFinished = true;
          throw err;
        });

      try {
        // Chunking animation
        for (let p = 15; p <= 35; p += 5) {
          if (uploadFinished) break;
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { stage: 'chunking', status: 'processing', progress: p }
          }));
          await new Promise(r => setTimeout(r, 120));
        }

        if (!uploadFinished) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { stage: 'embedding', status: 'processing', progress: 40 }
          }));
        }

        // Embedding animation
        for (let p = 40; p <= 75; p += 5) {
          if (uploadFinished) break;
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { stage: 'embedding', status: 'processing', progress: p }
          }));
          await new Promise(r => setTimeout(r, 120));
        }

        if (!uploadFinished) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { stage: 'vector_store', status: 'processing', progress: 80 }
          }));
        }

        // Vector store animation
        for (let p = 80; p <= 95; p += 5) {
          if (uploadFinished) break;
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: { stage: 'vector_store', status: 'processing', progress: p }
          }));
          await new Promise(r => setTimeout(r, 120));
        }

        await uploadPromise;

        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { stage: 'complete', status: 'success', progress: 100 }
        }));
        
        addToast(`Successfully uploaded ${file.name}`, 'success');

        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 3000);

      } catch (err) {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: { stage: 'failed', status: 'error', progress: 0 }
        }));
        addToast(`Failed to upload ${file.name}: ${err.response?.data?.detail || err.message}`);
        
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 4000);
      }
    }

    await loadDocuments();
    setUploading(false);
  };

  const handleLoadSample = async (filename) => {
    setUploading(true);

    let uploadFinished = false;

    setUploadProgress(prev => ({
      ...prev,
      [filename]: { stage: 'chunking', status: 'processing', progress: 15 }
    }));

    const uploadPromise = loadSampleDocument(filename)
      .then(res => {
        uploadFinished = true;
        return res;
      })
      .catch(err => {
        uploadFinished = true;
        throw err;
      });

    try {
      // Chunking simulation
      for (let p = 15; p <= 35; p += 5) {
        if (uploadFinished) break;
        setUploadProgress(prev => ({
          ...prev,
          [filename]: { stage: 'chunking', status: 'processing', progress: p }
        }));
        await new Promise(r => setTimeout(r, 120));
      }

      if (!uploadFinished) {
        setUploadProgress(prev => ({
          ...prev,
          [filename]: { stage: 'embedding', status: 'processing', progress: 40 }
        }));
      }

      // Embedding simulation
      for (let p = 40; p <= 75; p += 5) {
        if (uploadFinished) break;
        setUploadProgress(prev => ({
          ...prev,
          [filename]: { stage: 'embedding', status: 'processing', progress: p }
        }));
        await new Promise(r => setTimeout(r, 120));
      }

      if (!uploadFinished) {
        setUploadProgress(prev => ({
          ...prev,
          [filename]: { stage: 'vector_store', status: 'processing', progress: 80 }
        }));
      }

      // Vector store simulation
      for (let p = 80; p <= 95; p += 5) {
        if (uploadFinished) break;
        setUploadProgress(prev => ({
          ...prev,
          [filename]: { stage: 'vector_store', status: 'processing', progress: p }
        }));
        await new Promise(r => setTimeout(r, 120));
      }

      await uploadPromise;

      setUploadProgress(prev => ({
        ...prev,
        [filename]: { stage: 'complete', status: 'success', progress: 100 }
      }));
      
      addToast(`Sample ${filename} loaded successfully`, 'success');

      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[filename];
          return newProgress;
        });
      }, 3000);

    } catch (err) {
      setUploadProgress(prev => ({
        ...prev,
        [filename]: { stage: 'failed', status: 'error', progress: 0 }
      }));
      addToast(`Failed to load sample ${filename}: ${err.response?.data?.detail || err.message}`);
      
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[filename];
          return newProgress;
        });
      }, 4000);
    } finally {
      await loadDocuments();
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    disabled: uploading
  });

  const handleQuery = async (e) => {
    e?.preventDefault();
    if (!question.trim() || querying) return;

    setQuerying(true);
    const userQuestion = question;
    setQuestion('');
    setConversation(prev => [...prev, { type: 'user', content: userQuestion }]);

    try {
      const result = await queryDocuments(userQuestion);
      setConversation(prev => [...prev, {
        type: 'assistant',
        content: result.answer,
        sources: result.sources,
        confidence: result.confidence
      }]);
      fetchStats();
    } catch (err) {
      addToast(`Failed to get answer: ${err.response?.data?.detail || err.message}`);
      setConversation(prev => [...prev, {
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your question. Please try again.',
        error: true
      }]);
    } finally {
      setQuerying(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleQuery(e);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    try {
      await deleteDocument(documentId);
      await loadDocuments();
      addToast('Document deleted', 'success');
    } catch (err) {
      addToast(`Failed to delete document: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to delete all documents? This action cannot be undone.')) {
      return;
    }

    try {
      await clearAllDocuments();
      await loadDocuments();
      setConversation([]);
      addToast('All documents cleared', 'success');
    } catch (err) {
      addToast(`Failed to clear documents: ${err.response?.data?.detail || err.message}`);
    }
  };
  
  const handleClearConversation = () => {
    setConversation([]);
  };

  const getBadgeClass = (type) => {
    const t = type.toLowerCase();
    if (t === 'pdf') return 'badge-pdf';
    if (t === 'txt') return 'badge-txt';
    if (t === 'docx' || t === 'doc') return 'badge-docx';
    return 'badge-txt';
  };

  const docsPerPage = 5;
  const totalPages = Math.ceil(documents.length / docsPerPage);
  const indexOfLastDoc = currentPage * docsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - docsPerPage;
  const currentDocs = documents.slice(indexOfFirstDoc, indexOfLastDoc);

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      {/* Animated Background */}
      <div className="bg-grid"></div>
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>
      <div className="bg-orb bg-orb-4"></div>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            <p className="mr-4">{toast.message}</p>
            <button onClick={() => removeToast(toast.id)} className="ml-auto opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <header className="border-b border-white/10 flex-shrink-0 relative z-10 bg-[#08080f]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-600/20 flex items-center justify-center border border-primary-500/30 shadow-glow-sm">
                <Database className="w-5 h-5 text-primary-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight font-display">Ask Your Documents</h1>
                <p className="text-[11px] text-white/50 tracking-wide font-medium uppercase mt-0.5">AI Knowledge Base</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="hidden md:flex items-center gap-4 text-xs font-medium text-white/60">
                <div className="flex items-center gap-1.5" title="LLM Provider">
                  <MessageSquare className="w-4 h-4 text-primary-400" />
                  <span className="capitalize">{stats.provider || 'Loading...'}</span>
                </div>
                <div className="w-px h-4 bg-white/10"></div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>{stats.document_count} Docs</span>
                </div>
                <div className="w-px h-4 bg-white/10"></div>
                <div className="flex items-center gap-1.5">
                  <BarChart2 className="w-4 h-4 text-pink-400" />
                  <span>{stats.total_queries} Queries</span>
                </div>
              </div>

              {documents.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="btn-glass-danger glossy"
                >
                  <span className="flex items-center gap-1.5 relative z-10">
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full min-h-0">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-5 min-h-0 h-full overflow-y-auto pr-1 pb-4">
            
            {/* Upload Zone */}
            <div className="glass-card p-5 flex-shrink-0">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Upload className="w-4 h-4 text-cyan-400" />
                Add Knowledge
              </h2>

              <div
                {...getRootProps()}
                className={`drop-zone ${isDragActive ? 'drag-active' : ''} ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input {...getInputProps()} />
                <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <Upload className={`w-6 h-6 ${isDragActive ? 'text-primary-400 animate-bounce' : 'text-white/40'}`} />
                </div>
                {isDragActive ? (
                  <p className="text-primary-300 font-semibold text-sm">Drop to upload...</p>
                ) : (
                  <>
                    <p className="text-white/80 font-medium text-sm mb-1">Drag & drop files</p>
                    <p className="text-xs text-white/40">or click to browse</p>
                    <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-white/30 uppercase tracking-wider font-semibold">
                      <span>PDF</span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span>TXT</span>
                      <span className="w-1 h-1 rounded-full bg-white/20"></span>
                      <span>DOCX</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Sample Documents */}
            <div className="glass-card p-5 flex-shrink-0">
               <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
                <FileSearch className="w-4 h-4 text-pink-400" />
                Sample Docs
              </h2>
              <div className="flex flex-wrap gap-2">
                {['git_cheat_sheet.txt', 'python_zen.txt', 'markdown_spec.txt'].map(filename => (
                  <button
                    key={filename}
                    onClick={() => handleLoadSample(filename)}
                    disabled={uploading}
                    className="btn-glass-secondary text-left flex-1 min-w-[120px] glossy"
                  >
                    <span className="relative z-10 truncate block" title={filename}>
                      {filename.replace('.txt', '').replace('_', ' ')}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Document List */}
            <div className="glass-panel p-5 flex-1 flex flex-col min-h-[250px]">
              <h2 className="text-sm font-bold text-white mb-4 flex items-center justify-between uppercase tracking-wide">
                <span className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-primary-400" />
                  Vector DB
                </span>
                <span className="glass-badge">{documents.length} Files</span>
              </h2>

              {documents.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                  <Database className="w-10 h-10 mb-2 text-white/50" />
                  <p className="text-xs font-medium text-white/80">Database empty</p>
                  <p className="text-[10px] text-white/60 mt-1">Upload files to populate index</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {currentDocs.map((doc) => (
                    <div
                      key={doc.document_id}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1] transition-all duration-200"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`glass-badge ${getBadgeClass(doc.file_type)}`}>
                            {doc.file_type}
                          </span>
                          <p className="text-xs font-semibold text-white/90 truncate" title={doc.filename}>
                            {doc.filename}
                          </p>
                        </div>
                        <p className="text-[10px] text-white/40 font-medium tracking-wide">
                          {doc.chunk_count} VECTOR CHUNKS
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.document_id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                        title="Delete from index"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/10 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-glass-secondary"
                  >
                    Prev
                  </button>
                  <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-glass-secondary"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Main Chat Area */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-0">
            <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden relative">
              
              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-white/10 flex justify-between items-center bg-white/[0.02]">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <MessageSquare className="w-4 h-4 text-primary-400" />
                  Conversation
                </h2>
                {conversation.length > 0 && (
                  <button 
                    onClick={handleClearConversation}
                    className="text-[11px] font-semibold text-white/40 hover:text-white/80 transition-colors uppercase tracking-wide"
                  >
                    Clear Chat
                  </button>
                )}
              </div>

              {documents.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-6">
                  <div className="text-center max-w-sm">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10 shadow-glass">
                      <MessageSquare className="w-8 h-8 text-white/30" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">No Context Available</h3>
                    <p className="text-sm text-white/50 leading-relaxed">
                      Upload some documents to the vector database first, then you can ask questions about their contents using RAG.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-6 min-h-0 scroll-smooth">
                    {conversation.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-60">
                        <MessageSquare className="w-12 h-12 text-primary-400/50 mb-4" />
                        <h3 className="text-base font-bold text-white mb-2">Ask Anything</h3>
                        <p className="text-xs text-white/60 leading-relaxed">
                          Your documents have been processed and indexed into ChromaDB. The LLM will use them as context to answer your questions accurately.
                        </p>
                      </div>
                    ) : (
                      conversation.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={
                            message.type === 'user' ? 'chat-bubble-user' : 
                            message.error ? 'chat-bubble-error' : 'chat-bubble-ai'
                          }>
                            <p className="whitespace-pre-wrap">{message.content}</p>

                            {message.sources && message.sources.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Retrieved Context</p>
                                  {message.confidence !== undefined && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-white/40 uppercase">Confidence</span>
                                      <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                                        <div 
                                          className="confidence-fill" 
                                          style={{ width: `${Math.round(message.confidence * 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-[10px] font-bold text-white/70">
                                        {Math.round(message.confidence * 100)}%
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {message.sources.map((source, idx) => (
                                    <div key={idx} className="source-card group relative overflow-hidden">
                                      <div className="flex items-center gap-2 mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <span className={`glass-badge !text-[8px] ${getBadgeClass(source.metadata?.file_type || '')}`}>
                                          {source.metadata?.file_type || 'DOC'}
                                        </span>
                                        <span className="font-semibold text-white truncate text-[10px]">
                                          {source.metadata?.filename || 'Unknown source'}
                                        </span>
                                      </div>
                                      <p className="italic leading-relaxed">"{source.text}"</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                    
                    {querying && (
                      <div className="flex justify-start">
                        <div className="chat-bubble-ai flex items-center gap-2 px-5 py-4">
                          <span className="text-xs font-semibold text-white/50 mr-1">Generating</span>
                          <div className="flex gap-1">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-white/[0.02] border-t border-white/10">
                    <form onSubmit={handleQuery} className="relative">
                      <textarea
                        value={question}
                        onChange={(e) => setQuestion(e.target.value.slice(0, MAX_CHARS))}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask a question based on the documents..."
                        className="input-field input-glass w-full resize-none pr-32 pb-8"
                        rows="3"
                        disabled={querying}
                      />
                      
                      <div className="absolute bottom-3 left-4 flex items-center gap-3 pointer-events-none">
                        <span className={`text-[10px] font-bold tracking-wide ${question.length >= MAX_CHARS ? 'text-red-400' : 'text-white/30'}`}>
                          {question.length} / {MAX_CHARS}
                        </span>
                        <div className="flex items-center gap-1 text-white/20 text-[10px] font-semibold">
                          <Command className="w-3 h-3" />
                          <span>+ Enter</span>
                        </div>
                      </div>

                      <div className="absolute right-3 bottom-3">
                        <button
                          type="submit"
                          disabled={!question.trim() || querying}
                          className="btn-glass-primary glossy flex items-center gap-2 pl-4 pr-3 py-2"
                        >
                          <span className="relative z-10 font-bold tracking-wide">Ask</span>
                          <Send className="w-4 h-4 relative z-10" />
                        </button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Uploading Stepper Popup Modal */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08080f]/80 backdrop-blur-md p-4 transition-all">
          <div className="glass-card max-w-md w-full p-6 shadow-glow-purple">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></div>
                RAG Pipeline Active
              </h3>
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(uploadProgress).map(([filename, progressInfo]) => {
                const { stage, status, progress } = progressInfo;
                return (
                  <div key={filename} className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-white/90 truncate pr-3" title={filename}>{filename}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide border ${
                        status === 'success' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' : 
                        status === 'error' ? 'bg-red-400/10 text-red-400 border-red-400/20' : 
                        'bg-primary-400/10 text-primary-400 border-primary-400/20'
                      }`}>
                        {status === 'success' ? 'Indexed' : status === 'error' ? 'Failed' : `${progress}%`}
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="progress-track mb-5">
                      <div
                        className={`progress-fill ${status === 'success' ? 'success' : status === 'error' ? 'error' : 'animate-pulse'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Stepper Steps */}
                    {status === 'processing' && (
                      <div className="grid grid-cols-3 gap-2 text-center relative z-10">
                        {/* Line connector */}
                        <div className="absolute top-2.5 left-[16%] right-[16%] h-0.5 bg-white/10 -z-10"></div>
                        
                        <div className="flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] text-white transition-all duration-300 ${
                            stage === 'chunking' ? 'step-active' : 'step-done'
                          }`}>
                            {stage !== 'chunking' ? '✓' : '1'}
                          </div>
                          <span className={`mt-1.5 text-[9px] uppercase font-bold tracking-wider ${stage === 'chunking' ? 'text-primary-300' : 'text-white/40'}`}>Chunking</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] text-white transition-all duration-300 ${
                            stage === 'embedding' ? 'step-active' : (stage === 'vector_store' || stage === 'complete') ? 'step-done' : 'step-pending'
                          }`}>
                            { (stage === 'vector_store' || stage === 'complete') ? '✓' : '2'}
                          </div>
                          <span className={`mt-1.5 text-[9px] uppercase font-bold tracking-wider ${stage === 'embedding' ? 'text-cyan-300' : 'text-white/40'}`}>Embedding</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] text-white transition-all duration-300 ${
                            stage === 'vector_store' ? 'step-active' : 'step-pending'
                          }`}>
                            3
                          </div>
                          <span className={`mt-1.5 text-[9px] uppercase font-bold tracking-wider ${stage === 'vector_store' ? 'text-primary-300' : 'text-white/40'}`}>Vector DB</span>
                        </div>
                      </div>
                    )}

                    {status === 'success' && (
                      <div className="flex items-center justify-center gap-2 text-[10px] text-emerald-400 bg-emerald-400/10 py-2 rounded-lg border border-emerald-400/20 font-bold uppercase tracking-wider">
                        <CheckCircle className="w-3.5 h-3.5" /> Ready for Querying
                      </div>
                    )}
                    {status === 'error' && (
                      <div className="flex items-center justify-center gap-2 text-[10px] text-red-400 bg-red-400/10 py-2 rounded-lg border border-red-400/20 font-bold uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5" /> Pipeline Failed
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;