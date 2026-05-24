import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, orderBy, where, getDocs, arrayUnion, arrayRemove, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { Heart, MessageCircle, UserPlus, Check, Image as ImageIcon, Send, Phone, ArrowLeft, Users, Clock, Globe, X, Trash2 } from 'lucide-react';
import { t, LanguageCode, languages } from '../i18n';

interface SocialScreenProps {
  user: any;
  appLang: LanguageCode;
  showToast: (msg: string) => void;
}

export default function SocialScreen({ user, appLang, showToast }: SocialScreenProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'chats'>('feed');
  const [posts, setPosts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [friendships, setFriendships] = useState<any[]>([]);
  const [directChats, setDirectChats] = useState<any[]>([]);
  
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch Posts
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Fetch Users & Friendships
  useEffect(() => {
    if (!user) return;
    
    const usersQ = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQ, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).filter(u => u.id !== user.uid));
    });

    const friendshipsQ = query(collection(db, 'friendships'), where('participants', 'array-contains', user.uid));
    const unsubFriendships = onSnapshot(friendshipsQ, (snapshot) => {
      setFriendships(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubUsers();
      unsubFriendships();
    };
  }, [user]);

  // Fetch Direct Chats
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'directChats'), where('participants', 'array-contains', user.uid), orderBy('lastMessageTime', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDirectChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  // Fetch Active Chat Messages
  useEffect(() => {
    if (!activeChatId) return;
    const q = query(collection(db, 'directChats', activeChatId, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChatMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTimeout(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }, 100);
    });
    return () => unsubscribe();
  }, [activeChatId]);

  const handleCreatePost = async () => {
    if (!user) {
      showToast(t(appLang, 'signInToManage'));
      return;
    }
    if (!postText.trim() && !postImage) return;

    setIsPosting(true);
    try {
      let imageUrl = '';
      if (postImage) {
        const imageRef = ref(storage, `posts/${user.uid}_${Date.now()}`);
        await uploadBytes(imageRef, postImage);
        imageUrl = await getDownloadURL(imageRef);
      }

      await addDoc(collection(db, 'posts'), {
        userId: user.uid,
        userName: user.displayName || 'User',
        userAvatar: user.photoURL || 'https://via.placeholder.com/150',
        text: postText,
        image: imageUrl,
        likes: [],
        comments: [],
        createdAt: Date.now()
      });

      setPostText('');
      setPostImage(null);
      showToast('Post created!');
    } catch (error) {
      console.error('Error creating post:', error);
      showToast('Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleLikePost = async (postId: string, currentLikes: string[]) => {
    if (!user) return;
    const postRef = doc(db, 'posts', postId);
    if (currentLikes.includes(user.uid)) {
      await updateDoc(postRef, { likes: arrayRemove(user.uid) });
    } else {
      await updateDoc(postRef, { likes: arrayUnion(user.uid) });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      showToast('Post deleted');
    } catch (error) {
      console.error('Error deleting post:', error);
      showToast('Failed to delete post');
    }
  };

  const handleCommentPost = async (postId: string, currentComments: any[]) => {
    if (!user || !commentInputs[postId]?.trim()) return;
    const postRef = doc(db, 'posts', postId);
    const newComment = {
      userId: user.uid,
      userName: user.displayName || 'User',
      text: commentInputs[postId],
      createdAt: Date.now()
    };
    await updateDoc(postRef, { comments: arrayUnion(newComment) });
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleSendFriendRequest = async (targetUserId: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'friendships'), {
        participants: [user.uid, targetUserId],
        senderId: user.uid,
        status: 'pending',
        createdAt: Date.now()
      });
      showToast('Friend request sent');
    } catch (error) {
      console.error('Error sending request:', error);
    }
  };

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      await updateDoc(doc(db, 'friendships', friendshipId), {
        status: 'accepted',
        updatedAt: Date.now()
      });
      showToast('Friend request accepted');
    } catch (error) {
      console.error('Error accepting request:', error);
    }
  };

  const handleStartDirectChat = async (targetUser: any) => {
    if (!user) return;
    
    // Check if chat already exists
    const existingChat = directChats.find(c => c.participants.includes(targetUser.id));
    if (existingChat) {
      setActiveChatId(existingChat.id);
      return;
    }

    try {
      const newChatRef = await addDoc(collection(db, 'directChats'), {
        participants: [user.uid, targetUser.id],
        lastMessage: '',
        lastMessageTime: Date.now(),
        createdAt: Date.now()
      });
      setActiveChatId(newChatRef.id);
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const handleSendDirectMessage = async () => {
    if (!chatInput.trim() || !activeChatId || !user) return;

    const text = chatInput;
    setChatInput('');

    try {
      await addDoc(collection(db, 'directChats', activeChatId, 'messages'), {
        senderId: user.uid,
        text,
        timestamp: Date.now()
      });

      await updateDoc(doc(db, 'directChats', activeChatId), {
        lastMessage: text,
        lastMessageTime: Date.now()
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getFriendshipStatus = (targetUserId: string) => {
    const friendship = friendships.find(f => f.participants.includes(targetUserId));
    if (!friendship) return 'none';
    if (friendship.status === 'accepted') return 'accepted';
    if (friendship.senderId === user?.uid) return 'sent';
    return 'received';
  };

  const getOtherParticipant = (chat: any) => {
    const otherId = chat.participants.find((id: string) => id !== user?.uid);
    return users.find(u => u.id === otherId) || { displayName: 'Unknown', photoURL: 'https://via.placeholder.com/150' };
  };

  // Chat View
  if (activeChatId) {
    const activeChat = directChats.find(c => c.id === activeChatId);
    const otherUser = activeChat ? getOtherParticipant(activeChat) : null;

    return (
      <div className="flex flex-col h-[calc(100vh-5rem)] bg-slate-50 relative z-10">
        <div className="bg-white p-4 flex items-center gap-4 shadow-sm z-20">
          <button onClick={() => setActiveChatId(null)} className="p-2 hover:bg-slate-100 rounded-full">
            <ArrowLeft className="w-6 h-6 text-slate-700" />
          </button>
          {otherUser && (
            <>
              <img src={otherUser.photoURL || 'https://via.placeholder.com/150'} alt={otherUser.displayName} className="w-10 h-10 rounded-full object-cover" />
              <div className="flex-1">
                <h3 className="font-bold text-slate-900">{otherUser.displayName}</h3>
              </div>
              {otherUser.phone && (
                <a href={`tel:${otherUser.phone}`} className="p-3 bg-green-100 text-green-600 rounded-full hover:bg-green-200 transition-colors">
                  <Phone className="w-5 h-5" />
                </a>
              )}
            </>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map(msg => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-2xl ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none shadow-sm border border-slate-100'}`}>
                  <p>{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white p-4 border-t border-slate-100 flex items-center gap-2">
          <input 
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendDirectMessage()}
            placeholder={t(appLang, 'typeMessage')}
            className="flex-1 bg-slate-100 border-none rounded-full px-4 py-3 focus:ring-2 focus:ring-indigo-600 outline-none"
          />
          <button 
            onClick={handleSendDirectMessage}
            disabled={!chatInput.trim()}
            className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full pb-24">
      <div className="flex bg-white rounded-2xl p-1 mb-6 shadow-sm border border-slate-100">
        <button 
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'feed' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          {t(appLang, 'feed')}
        </button>
        <button 
          onClick={() => setActiveTab('friends')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'friends' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          {t(appLang, 'friends')}
        </button>
        <button 
          onClick={() => setActiveTab('chats')}
          className={`flex-1 py-3 text-sm font-bold rounded-xl transition-colors ${activeTab === 'chats' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          {t(appLang, 'messages')}
        </button>
      </div>

      {activeTab === 'feed' && (
        <div className="space-y-6">
          {user && (
            <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
              <div className="flex gap-3 mb-4">
                <img src={user.photoURL || 'https://via.placeholder.com/150'} alt="User" className="w-10 h-10 rounded-full object-cover" />
                <textarea 
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  placeholder={t(appLang, 'whatsOnYourMind')}
                  className="flex-1 bg-slate-50 border-none rounded-2xl p-3 resize-none focus:ring-2 focus:ring-indigo-600 outline-none"
                  rows={2}
                />
              </div>
              {postImage && (
                <div className="relative mb-4">
                  <img src={URL.createObjectURL(postImage)} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                  <button onClick={() => setPostImage(null)} className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="flex justify-between items-center">
                <label className="cursor-pointer p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                  <ImageIcon className="w-6 h-6" />
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setPostImage(e.target.files?.[0] || null)} />
                </label>
                <button 
                  onClick={handleCreatePost}
                  disabled={isPosting || (!postText.trim() && !postImage)}
                  className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {isPosting ? '...' : t(appLang, 'post')}
                </button>
              </div>
            </div>
          )}

          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={post.userAvatar} alt={post.userName} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h3 className="font-bold text-slate-900">{post.userName}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {user?.uid === post.userId && (
                  <button onClick={() => handleDeletePost(post.id)} className="text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
              {post.text && <p className="px-4 pb-3 text-slate-800">{post.text}</p>}
              {post.image && <img src={post.image} alt="Post" className="w-full max-h-96 object-cover" />}
              <div className="p-4 border-t border-slate-50 flex gap-4">
                <button 
                  onClick={() => handleLikePost(post.id, post.likes)}
                  className={`flex items-center gap-2 font-bold ${post.likes?.includes(user?.uid) ? 'text-rose-500' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <Heart className={`w-5 h-5 ${post.likes?.includes(user?.uid) ? 'fill-current' : ''}`} /> {post.likes?.length || 0}
                </button>
                <div className="flex items-center gap-2 font-bold text-slate-500">
                  <MessageCircle className="w-5 h-5" /> {post.comments?.length || 0}
                </div>
              </div>
              
              <div className="px-4 pb-4 space-y-2">
                {post.comments?.map((comment: any, i: number) => (
                  <div key={i} className="flex gap-2">
                    <span className="font-bold text-sm text-slate-900">{comment.userName}:</span>
                    <span className="text-sm text-slate-700">{comment.text}</span>
                  </div>
                ))}
                <div className="flex gap-2 mt-2">
                  <input 
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                    placeholder={t(appLang, 'writeComment')}
                    className="flex-1 bg-slate-50 border-none rounded-full px-4 py-2 text-sm outline-none"
                  />
                  <button onClick={() => handleCommentPost(post.id, post.comments)} className="text-indigo-600 font-bold text-sm">
                    {t(appLang, 'post')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'friends' && (
        <div className="space-y-4">
          {users.map(u => {
            const status = getFriendshipStatus(u.id);
            const friendship = friendships.find(f => f.participants.includes(u.id));
            
            return (
              <div key={u.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <img src={u.photoURL || 'https://via.placeholder.com/150'} alt={u.displayName} className="w-12 h-12 rounded-full object-cover" />
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900">{u.displayName}</h3>
                  {u.bio && <p className="text-xs text-slate-500 line-clamp-1">{u.bio}</p>}
                </div>
                
                {status === 'none' && (
                  <button onClick={() => handleSendFriendRequest(u.id)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100">
                    <UserPlus className="w-5 h-5" />
                  </button>
                )}
                {status === 'sent' && (
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">Pending</span>
                )}
                {status === 'received' && (
                  <button onClick={() => handleAcceptFriendRequest(friendship.id)} className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700">
                    {t(appLang, 'accept')}
                  </button>
                )}
                {status === 'accepted' && (
                  <div className="flex gap-2">
                    <button onClick={() => handleStartDirectChat(u)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100">
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    {u.phone && (
                      <a href={`tel:${u.phone}`} className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100">
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'chats' && (
        <div className="space-y-2">
          {directChats.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No messages yet</p>
            </div>
          ) : (
            directChats.map(chat => {
              const otherUser = getOtherParticipant(chat);
              return (
                <div 
                  key={chat.id} 
                  onClick={() => setActiveChatId(chat.id)}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <img src={otherUser.photoURL || 'https://via.placeholder.com/150'} alt={otherUser.displayName} className="w-12 h-12 rounded-full object-cover" />
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-slate-900">{otherUser.displayName}</h3>
                      <span className="text-xs text-slate-400">
                        {new Date(chat.lastMessageTime).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 line-clamp-1">{chat.lastMessage || 'Started a chat'}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
