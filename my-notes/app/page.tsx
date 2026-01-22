'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function NotesApp() {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [user, setUser] = useState<any>(null);
  
  // 改用 username 來存輸入框的字
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const supabase = createClient();

  // 這是一個虛擬的網域，用來欺騙 Supabase 這是個 Email
  const FAKE_DOMAIN = "@my-notes.com";

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

  // 註冊：把 使用者名稱 + 虛擬網域 拼起來
  const handleSignUp = async () => {
    if (!username || !password) return alert("請輸入帳號密碼");
    
    setLoading(true);
    // 這裡動了手腳：把 'admin' 變成 'admin@my-notes.com'
    const email = username + FAKE_DOMAIN; 
    
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
    else {
      alert('註冊成功！系統已為您登入。');
      await handleLogin();
    }
    setLoading(false);
  };

  // 登入：同樣把 使用者名稱 + 虛擬網域 拼起來驗證
  const handleLogin = async () => {
    if (!username || !password) return alert("請輸入帳號密碼");

    setLoading(true);
    const email = username + FAKE_DOMAIN;

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
    setUsername(''); // 登出後清空欄位
    setPassword('');
  };

  // 取得顯示用的名字 (把後面的 @my-notes.com 切掉，只顯示小明)
  const getDisplayName = () => {
    if (!user || !user.email) return '使用者';
    return user.email.split('@')[0];
  }

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold text-indigo-900 mb-8">🔐 我的私密筆記本</h1>

      {!user ? (
        // === 登入區塊 ===
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-indigo-100">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-700">歡迎回來</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">使用者名稱</label>
              <input
                type="text" // 這裡改成 text，不再是 email
                placeholder="例如：admin"
                value={username}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-600 mb-1">密碼</label>
              <input
                type="password"
                placeholder="輸入密碼"
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
        // === 筆記區塊 ===
        <div className="w-full max-w-2xl animate-fade-in">
          
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                {getDisplayName()[0].toUpperCase()}
              </div>
              <span className="text-gray-700 font-medium">{getDisplayName()}</span>
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