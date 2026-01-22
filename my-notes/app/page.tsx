'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function NotesApp() {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  useEffect(() => {
    // 檢查登入狀態
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchNotes();
    };
    getUser();
  }, []);

  // 抓取筆記
  const fetchNotes = async () => {
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false }); // 依照時間排序
    if (data) setNotes(data);
  };

  // 新增筆記
  const addNote = async () => {
    if (!newNote.trim()) return;
    const { error } = await supabase.from('notes').insert([{ content: newNote }]);
    if (!error) {
      setNewNote('');
      fetchNotes();
    }
  };

  // 註冊功能
  const handleSignUp = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else {
      alert('註冊成功！請直接登入。');
      await handleLogin(); // 註冊完嘗試直接登入
    }
    setLoading(false);
  };

  // 登入功能
  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('登入失敗：' + error.message);
    } else {
      setUser(data.user);
      fetchNotes();
    }
    setLoading(false);
  };

  // 登出
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotes([]);
  };

  return (
    // [版面設定] min-h-screen: 讓背景填滿螢幕, bg-gray-100: 淺灰背景
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      
      {/* 標題區 */}
      <h1 className="text-3xl font-bold text-gray-800 mb-8">📒 我的雲端筆記本</h1>

      {!user ? (
        // === 登入卡片 ===
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-xl font-semibold mb-4 text-center">請先登入</h2>
          <input
            type="email"
            placeholder="Email"
            className="w-full p-3 mb-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="密碼"
            className="w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
            >
              {loading ? '處理中...' : '登入'}
            </button>
            <button 
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-green-600 text-white p-2 rounded hover:bg-green-700 transition"
            >
              註冊
            </button>
          </div>
        </div>
      ) : (
        // === 筆記內容區 ===
        <div className="w-full max-w-2xl">
          
          {/* 歡迎與登出列 */}
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
            <span className="text-gray-600">使用者：{user.email}</span>
            <button 
              onClick={handleLogout}
              className="text-sm text-red-500 hover:text-red-700 underline"
            >
              登出
            </button>
          </div>

          {/* 輸入框 */}
          <div className="flex gap-2 mb-6">
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="寫點什麼..."
              className="flex-1 p-4 rounded-lg shadow-sm border-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
            />
            <button 
              onClick={addNote}
              className="bg-blue-600 text-white px-6 rounded-lg font-bold hover:bg-blue-700 shadow-md transition"
            >
              新增
            </button>
          </div>

          {/* 筆記列表 */}
          <div className="space-y-3">
            {notes.map((note) => (
              <div key={note.id} className="bg-white p-5 rounded-lg shadow-sm border-l-4 border-blue-500 hover:shadow-md transition">
                <p className="text-gray-800 text-lg">{note.content}</p>
                <p className="text-xs text-gray-400 mt-2 text-right">
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-center text-gray-500 mt-10">目前沒有筆記，快來寫第一篇吧！</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}