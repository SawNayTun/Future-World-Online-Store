import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, User, Store, MapPin, ArrowLeft, Globe, MessageCircle, Check, CheckCheck, Image as ImageIcon } from 'lucide-react';
import { translateText } from '../services/geminiService';
import { languages, LanguageCode, t } from '../i18n';
import { Product, Seller } from '../types';
import { User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, doc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface Message {
  id: string;
  senderId: string;
  text: string;
  originalLang: LanguageCode;
  translations: Partial<Record<LanguageCode, string>>;
  timestamp: number;
  isLocation?: boolean;
  isRead?: boolean;
}

interface Chat {
  id: string;
  buyerId: string;
  sellerId: string;
  deliveryId?: string;
  participants: string[];
  productId: string;
  productTitle: string;
  productImage: string;
  lastMessage: string;
  lastMessageTime: number;
  createdAt: number;
  buyerTyping?: boolean;
  sellerTyping?: boolean;
  // Additional fields for UI
  otherPartyName?: string;
  otherPartyAvatar?: string;
  otherPartyLanguage?: LanguageCode;
  unreadCount?: number;
}

interface ChatSystemProps {
  activeSeller: Seller | null;
  chatProduct: Product | null;
  appLang: LanguageCode;
  user: FirebaseUser | null;
  userRole: 'buyer' | 'seller' | 'delivery';
  onSelectSeller: (seller: Seller) => void;
  onBackToInbox: () => void;
}

export default function ChatSystem({ activeSeller, chatProduct, appLang, user, userRole, onSelectSeller, onBackToInbox }: ChatSystemProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch chats for the current user
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList: Chat[] = [];
      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data() as Chat;
        data.id = docSnapshot.id;
        
        // Fetch other party's info (for simplicity, show seller if buyer, or buyer if seller/delivery)
        let otherPartyId = data.buyerId;
        if (user.uid === data.buyerId) {
          otherPartyId = data.sellerId;
        }
        
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', otherPartyId)));
        if (!userDoc.empty) {
          const userData = userDoc.docs[0].data();
          data.otherPartyName = userData.displayName || 'Unknown User';
          data.otherPartyAvatar = userData.photoURL || 'https://via.placeholder.com/150';
          data.otherPartyLanguage = userData.language || 'en'; 
        }

        // Count unread messages
        const unreadQ = query(
          collection(db, 'chats', docSnapshot.id, 'messages'),
          where('senderId', '!=', user.uid),
          where('isRead', '==', false)
        );
        const unreadSnapshot = await getDocs(unreadQ);
        data.unreadCount = unreadSnapshot.size;

        chatList.push(data);
      }
      // Sort by lastMessageTime descending
      chatList.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
      setChats(chatList);
    });

    return () => unsubscribe();
  }, [user, userRole]);

  // Handle initialization of a new chat from product page
  useEffect(() => {
    if (activeSeller && chatProduct && user && userRole === 'buyer') {
      const initChat = async () => {
        // Check if chat already exists
        const q = query(
          collection(db, 'chats'), 
          where('buyerId', '==', user.uid), 
          where('sellerId', '==', activeSeller.id),
          where('productId', '==', chatProduct.id)
        );
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          setActiveChatId(snapshot.docs[0].id);
        } else {
          // Create new chat
          const newChatRef = await addDoc(collection(db, 'chats'), {
            buyerId: user.uid,
            sellerId: activeSeller.id,
            participants: [user.uid, activeSeller.id],
            productId: chatProduct.id,
            productTitle: chatProduct.name,
            productImage: chatProduct.image,
            lastMessage: '',
            lastMessageTime: Date.now(),
            createdAt: Date.now()
          });
          setActiveChatId(newChatRef.id);
        }
      };
      initChat();
    }
  }, [activeSeller, chatProduct, user, userRole]);

  // Fetch messages for active chat
  useEffect(() => {
    if (!activeChatId) return;

    const q = query(
      collection(db, 'chats', activeChatId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgList: Message[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data() as Message;
        data.id = doc.id;
        msgList.push(data);
      });
      setMessages(msgList);
    });

    return () => unsubscribe();
  }, [activeChatId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }

    // Mark messages as read
    if (activeChatId && user && messages.length > 0) {
      const unreadMessages = messages.filter(m => m.senderId !== user.uid && !m.isRead);
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(async (msg) => {
          try {
            await updateDoc(doc(db, 'chats', activeChatId, 'messages', msg.id), {
              isRead: true
            });
          } catch (error) {
            console.error("Error marking message as read", error);
          }
        });
      }
    }
  }, [messages, activeChatId, user]);

  const handleSendMessage = async (text: string, isLocation = false, imageUrl?: string) => {
    if ((!text.trim() && !imageUrl) || isTranslating || !activeChatId || !user) return;

    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) return;

    setInput('');
    setIsTranslating(true);

    const targetLang = activeChat.otherPartyLanguage || 'en';

    try {
      let translatedText = '';
      if (text.trim()) {
        const targetLangName = languages[targetLang];
        translatedText = await translateText(text, targetLangName);
      }

      const newMessage: any = {
        senderId: user.uid,
        text: text,
        originalLang: appLang,
        translations: {
          [appLang]: text,
          [targetLang]: translatedText
        },
        timestamp: Date.now(),
        isLocation,
        isRead: false
      };

      if (imageUrl) {
        newMessage.imageUrl = imageUrl;
      }

      await addDoc(collection(db, 'chats', activeChatId, 'messages'), newMessage);
      
      await updateDoc(doc(db, 'chats', activeChatId), {
        lastMessage: imageUrl ? '📷 Photo' : text,
        lastMessageTime: Date.now()
      });

    } catch (error) {
      console.error("Message sending failed", error);
    } finally {
      setIsTranslating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800 * 1024) {
      alert('Image size must be less than 800KB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      await handleSendMessage('', false, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSendLocation = () => {
    if (!navigator.geolocation) {
      alert(t(appLang, 'geoNotSupported'));
      return;
    }

    setIsTranslating(true); // Reuse translating state for loading
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const locationText = `📍 Location: https://www.google.com/maps?q=${latitude},${longitude}`;
        handleSendMessage(locationText, true);
        setIsTranslating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location. Please check permissions.');
        setIsTranslating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (!user) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Please Login</h2>
        <p className="text-slate-500">You need to be logged in to use the chat feature.</p>
      </div>
    );
  }

  if (!activeChatId && !activeSeller) {
    // Inbox View
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[500px]">
        <div className="bg-slate-900 text-white p-6">
          <h2 className="text-2xl font-bold">{t(appLang, 'inbox')}</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {chats.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No chats yet.</div>
          ) : (
            chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="relative">
                  <img src={chat.otherPartyAvatar} alt={chat.otherPartyName} className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm" />
                  {chat.unreadCount ? (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                      {chat.unreadCount}
                    </span>
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-lg truncate">{chat.otherPartyName}</h3>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                      {new Date(chat.lastMessageTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {languages[chat.otherPartyLanguage || 'en']}
                    </p>
                    {chat.deliveryId && (
                      <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Delivery Active</span>
                    )}
                  </div>
                  <p className={`text-sm truncate mt-1 ${chat.unreadCount ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[600px] relative">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 p-4 flex items-center gap-4 z-10">
        <button 
          onClick={() => {
            setActiveChatId(null);
            onBackToInbox();
          }}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        {activeChat && (
          <div className="flex items-center gap-3">
            <img src={activeChat.otherPartyAvatar} alt={activeChat.otherPartyName} className="w-10 h-10 rounded-full object-cover shadow-sm" />
            <div>
              <h3 className="font-bold text-slate-900">{activeChat.otherPartyName}</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Globe className="w-3 h-3" /> {languages[activeChat.otherPartyLanguage || 'en']}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Product Info Banner */}
      {activeChat && (
        <div className="bg-indigo-50/50 p-2 px-4 border-b border-indigo-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={activeChat.productImage} alt={activeChat.productTitle} className="w-8 h-8 rounded-lg object-cover border border-white" />
            <p className="text-xs font-medium text-slate-700 line-clamp-1">{activeChat.productTitle}</p>
          </div>
          {activeChat.deliveryId && (
            <div className="flex items-center gap-1.5 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
              <MapPin className="w-3 h-3" /> Delivery
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          const displayLang = appLang;
          const displayText = msg.translations[displayLang] || msg.text;

          return (
            <motion.div 
              key={msg.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] space-y-1 ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                <div className={`rounded-2xl p-3.5 shadow-sm ${
                  isMe 
                    ? 'bg-indigo-600 text-white rounded-tr-sm' 
                    : 'bg-white text-slate-900 border border-slate-100 rounded-tl-sm'
                }`}>
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Chat" className="max-w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(msg.imageUrl)} />
                  )}
                  
                  {msg.isLocation ? (
                    <div className="space-y-3 min-w-[200px]">
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <MapPin className="w-4 h-4" /> Location Shared
                      </div>
                      <a 
                        href={displayText.split(': ')[1]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                          isMe ? 'bg-white text-indigo-600' : 'bg-indigo-600 text-white'
                        }`}
                      >
                        <Globe className="w-4 h-4" /> View on Map
                      </a>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">{displayText}</p>
                  )}
                  
                  {!isMe && msg.originalLang !== appLang && (
                    <div className={`mt-2 text-[10px] pt-2 border-t ${isMe ? 'border-white/20 text-indigo-100' : 'border-slate-100 text-slate-400'}`}>
                      <span className="font-medium">Translated from {languages[msg.originalLang]}</span>
                    </div>
                  )}
                </div>
                <div className={`flex items-center gap-1.5 text-[10px] ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {isMe && (
                    msg.isRead ? <CheckCheck className="w-3 h-3 text-indigo-500" /> : <Check className="w-3 h-3" />
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
        {isTranslating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm p-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2">
          <label className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">
            <ImageIcon className="w-5 h-5" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          {userRole === 'buyer' && (
            <button 
              onClick={handleSendLocation}
              className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-colors"
              title="Send Location"
            >
              <MapPin className="w-5 h-5" />
            </button>
          )}
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(input)}
              placeholder={t(appLang, 'typeMessage')}
              className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 rounded-xl px-4 py-3 outline-none transition-all text-sm"
            />
          </div>
          <button 
            onClick={() => handleSendMessage(input)}
            disabled={!input.trim() || isTranslating}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md shadow-indigo-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
