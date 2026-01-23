'use client';

import { useEffect, useState } from 'react';

// ==========================================
// [⚠️ 環境切換說明：請在 VS Code 中閱讀此段]
//
// 目前為了讓您在線上能看到畫面，預設開啟 [模擬模式]。
// 當您要部署到 Vercel 時，請執行以下 3 步驟：
//
// 1. 確保終端機已執行安裝: npm install @supabase/supabase-js
// 2. [解除註解] 下方的「正式連線區塊 (A)」
// 3. [刪除或註解] 下方的「模擬連線區塊 (B)」
// ==========================================


// --- [A. 正式連線區塊] (請在 VS Code 解除這段的註解 //) ---
/*
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createSupabaseClient(supabaseUrl, supabaseKey);
};
*/

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createSupabaseClient(supabaseUrl, supabaseKey);
};



export default function CheckPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // 登入欄位
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 使用 useState 確保只建立一次 mock client
  const [supabase] = useState(() => createClient());
  const FAKE_DOMAIN = "@my-notes.com";

  // === [修正] 轉碼工具 (與主頁面同步使用 Hex) ===
  const encodeName = (name: string) => {
    try {
      let hex = '';
      for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i).toString(16);
        hex += ('0000' + char).slice(-4);
      }
      return hex;
    } catch {
      return name;
    }
  };

  const decodeName = (email: string) => {
    try {
      const hex = email.split('@')[0];
      let str = '';
      for (let i = 0; i < hex.length; i += 4) {
        str += String.fromCharCode(parseInt(hex.substr(i, 4), 16));
      }
      return str;
    } catch {
      return email ? email.split('@')[0] : '使用者';
    }
  };

  // 判斷是否過期
  const isExpired = (endDate: string, endTime: string) => {
    if (!endDate) return false;
    const endDateTimeStr = `${endDate}T${endTime || '23:59:59'}`;
    return new Date(endDateTimeStr) < new Date();
  };

  // 檢查登入狀態
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) fetchMyRecords();
    };
    checkUser();
  }, []);

  // 抓取該使用者的紀錄
  const fetchMyRecords = async () => {
    setLoading(true);
    // @ts-ignore
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      // @ts-ignore
      .order('created_at', { ascending: false });
    
    if (error) {
      alert('讀取失敗：' + error.message);
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  // 登入功能
  const handleLogin = async () => {
    if (!username || !password) {
      setErrorMsg("請輸入帳號與密碼");
      return;
    }
    setErrorMsg('');
    setLoading(true);

    const email = encodeName(username) + FAKE_DOMAIN;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // @ts-ignore
      setErrorMsg('登入失敗，請檢查帳號密碼是否正確');
    } else {
      setUser(data.user);
      fetchMyRecords();
    }
    setLoading(false);
  };

  // 登出功能
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotes([]);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center py-10 px-4 font-sans text-gray-900">
      
      {/* 頁面標題 */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-amber-900 tracking-wide">個人報名紀錄查詢</h1>
        <p className="text-amber-700 mt-2">請輸入您的資料以查詢登記狀態</p>
      </div>

      {!user ? (
        // === 登入區塊 ===
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-amber-200">
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">姓名 (帳號)</label>
              <input
                type="text"
                placeholder="請輸入註冊時的姓名"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">密碼</label>
              <input
                type="password"
                placeholder="請輸入密碼"
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            
            {errorMsg && (
              <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{errorMsg}</p>
            )}

            <button 
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-amber-700 text-white py-3 rounded-lg font-bold hover:bg-amber-800 transition shadow-md disabled:bg-gray-400"
            >
              {loading ? '查詢中...' : '登入查詢'}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-400 hover:text-amber-700 underline">
              回首頁報名
            </a>
            <p className="mt-4 text-xs text-gray-400">*預覽模式：使用模擬資料 (請依檔案說明切換為正式版)</p>
          </div>
        </div>
      ) : (
        // === 資料顯示區塊 ===
        <div className="w-full max-w-3xl animate-fade-in">
          
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-amber-200">
            <span className="text-gray-700 font-medium">
              查詢對象：<span className="text-amber-700 font-bold text-lg">{decodeName(user.email || '')}</span>
            </span>
            <button 
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 px-4 py-2 rounded-md hover:bg-red-50 transition border border-transparent hover:border-red-100"
            >
              結束查詢
            </button>
          </div>

          <div className="space-y-4">
            {notes.length > 0 ? (
              notes.map((note) => {
                const completed = isExpired(note.end_date, note.end_time);
                return (
                  <div key={note.id} className={`bg-white p-6 rounded-xl shadow-sm border relative overflow-hidden transition ${completed ? 'border-gray-200 bg-gray-50/50' : 'border-amber-100 hover:border-amber-300'}`}>
                    
                    {/* 狀態標籤 */}
                    <div className="absolute top-0 right-0">
                       {completed ? (
                         <span className="bg-gray-200 text-gray-500 text-xs font-bold px-3 py-1 rounded-bl-lg block">已圓滿</span>
                       ) : (
                         <span className={`text-xs font-bold px-3 py-1 rounded-bl-lg block text-white ${note.action_type === '新增' ? 'bg-blue-500' : 'bg-orange-500'}`}>
                           {note.action_type}
                         </span>
                       )}
                    </div>

                    <div className="mb-4">
                      <h3 className={`text-xl font-bold mb-1 ${completed ? 'text-gray-500' : 'text-amber-900'}`}>
                        {note.team_big} <span className="text-sm font-normal text-gray-500">| {note.team_small}</span>
                      </h3>
                      <p className="text-sm text-gray-500">精舍地點：{note.monastery}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-amber-50/50 p-4 rounded-lg">
                      <div>
                        <p className="text-gray-400 mb-1">發心時間</p>
                        <p className="font-medium text-gray-700">
                          {note.start_date} {note.start_time} <br/>
                          <span className="text-gray-400 text-xs">至</span> <br/>
                          {note.end_date} {note.end_time}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p><span className="text-gray-400">法名：</span> {note.dharma_name || '-'}</p>
                        <p><span className="text-gray-400">協助報名：</span> {note.need_help ? '是' : '否'}</p>
                        <p><span className="text-gray-400">備註：</span> {note.memo || '無'}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-50 flex justify-between items-end">
                      <span className="text-xs text-gray-300">ID: {note.id}</span>
                      <span className="text-xs text-gray-400">登記日期：{new Date(note.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 bg-white/50 rounded-xl border border-dashed border-amber-200">
                <p className="text-gray-500 text-lg">查無此帳號的報名紀錄</p>
                <p className="text-gray-400 text-sm mt-2">請確認是否已完成報名</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}