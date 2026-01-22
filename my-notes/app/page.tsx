'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function NotesApp() {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [user, setUser] = useState<any>(null);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();
  const FAKE_DOMAIN = "@my-notes.com";

  // === 關鍵修改：轉碼工具 ===
  // 把中文轉成亂碼 (例如：小明 -> 5bCP5piO)
  const encodeName = (name: string) => {
    try {
      return btoa(encodeURIComponent(name)).replace(/=/g, '');
    } catch {
      return name;
    }
  };

  // 把亂碼轉回中文 (例如：5bCP5piO -> 小明)
  const decodeName = (email: string) => {
    try {
      const namePart = email.split('@')[0];
      return decodeURIComponent(atob(namePart));
    } catch {
      return email ? email.split('@')[0] : '使用者';
    }
  };
  // ========================

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchNotes();
    };
    getUser();
  }, []);

  const fetchNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setNotes(data);
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    const { error } = await supabase.from('notes').insert([{ content: newNote }]);
    if (!error) {
      setNewNote('');
      fetchNotes();
    }
  };

  const handleSignUp = async () => {
    if (!username || !password) return alert("請輸入帳號密碼");
    setLoading(true);
    
    // 這裡使用 encodeName 把中文轉成英文亂碼
    const email = encodeName(username) + FAKE_DOMAIN; 
    
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert('註冊失敗：' + error.message);
    else {
      alert('註冊成功！系統已為您登入。');
      await handleLogin();
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!username || !password) return alert("請輸入帳號密碼");
    setLoading(true);

    // 登入時也要轉碼才找得到人
    const email = encodeName(username) + FAKE_DOMAIN;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('登入失敗：' + error.message);
    } else {
      setUser(data.user);
      fetchNotes();
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotes([]);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold text-indigo-900 mb-8">一一報名系統</h1>

      {!user ? (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-indigo-100">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-700">歡迎回來</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">使用者名稱 (可輸入中文)</label>
              <input
                type="text"
                placeholder="例如：小明"
                value={username}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">密碼</label>
              <input
                type="password"
                placeholder="輸入密碼至少六碼"
                value={password}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition shadow-sm"
            >
              {loading ? '...' : '登入'}
            </button>
            <button 
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-white text-indigo-600 border border-indigo-200 py-3 rounded-lg font-medium hover:bg-indigo-50 transition"
            >
              註冊
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-2xl animate-fade-in">
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                {/* 顯示頭像字首 */}
                {(decodeName(user.email) || 'U')[0]}
              </div>
              {/* 這裡使用 decodeName 把亂碼轉回中文顯示 */}
              <span className="text-gray-700 font-medium">嗨，{decodeName(user.email)}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 px-3 py-1 rounded-md hover:bg-red-50 transition"
            >
              登出
            </button>
          </div>

          <div className="relative mb-8">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="有什麼新想法？..."
              className="w-full p-5 pr-24 rounded-xl shadow-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
            />
            <button 
              onClick={addNote}
              className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-lg font-bold hover:bg-indigo-700 transition shadow-md"
            >
              新增
            </button>
          </div>

          <div className="space-y-4">
            {notes.map((note) => (
              <div key={note.id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 group">
                <p className="text-gray-800 text-lg leading-relaxed">{note.content}</p>
                <div className="flex justify-between items-center mt-4 border-t pt-3 border-gray-50">
                  <span className="text-xs text-gray-400">
                    {new Date(note.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
            {notes.length === 0 && (
              <div className="text-center py-12 bg-white/50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500">還沒有筆記，試著寫下第一條吧！</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}