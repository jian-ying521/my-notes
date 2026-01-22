'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function NotesApp() {
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    // 1. 檢查有沒有登入
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchNotes(); // 如果有登入，就抓取筆記
    };
    getUser();
  }, []);

  // 2. 抓取筆記 (因為有 RLS，系統會自動只抓該使用者的)
  const fetchNotes = async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('id', { ascending: false });
    if (data) setNotes(data);
  };

  // 3. 新增筆記
  const addNote = async () => {
    if (!newNote.trim()) return;
    const { error } = await supabase
      .from('notes')
      .insert([{ content: newNote }]); // 這裡不需要傳 user_id，Supabase 會自動填
    
    if (!error) {
      setNewNote('');
      fetchNotes(); // 重新整理列表
    }
  };

  // 4. 登入/登出功能
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'github' });
    // 如果沒設定 GitHub 登入，也可以改用 signInWithPassword 等
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotes([]);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>🔐 我的私密筆記</h1>
      
      {!user ? (
        <div>
          <p>請先登入才能查看您的筆記。</p>
          <button onClick={handleLogin} style={btnStyle}>GitHub 登入 (或使用預設頁面登入)</button>
          <p style={{fontSize: '0.8rem', color: '#666'}}>*如果您尚未設定 GitHub OAuth，請直接前往 /login 頁面登入</p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p>歡迎, {user.email}</p>
            <button onClick={handleLogout} style={{...btnStyle, backgroundColor: '#666'}}>登出</button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="寫下您的想法..."
              style={inputStyle}
            />
            <button onClick={addNote} style={btnStyle}>新增</button>
          </div>

          <ul style={{ listStyle: 'none', padding: 0 }}>
            {notes.map((note) => (
              <li key={note.id} style={cardStyle}>
                {note.content}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// 簡單的樣式
const btnStyle = { padding: '10px 20px', backgroundColor: '#0070f3', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };
const inputStyle = { flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' };
const cardStyle = { padding: '15px', border: '1px solid #eee', borderRadius: '8px', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };