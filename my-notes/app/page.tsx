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
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('警告：找不到 Supabase 環境變數，請檢查 Vercel 設定。');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
};
*/

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('警告：找不到 Supabase 環境變數，請檢查 Vercel 設定。');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
};




export default function RegistrationApp() {
  const [notes, setNotes] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  
  const [username, setUsername] = useState('');
  const [idLast4, setIdLast4] = useState(''); // 身分證後四碼
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  const [formData, setFormData] = useState({
    team_big: '觀音隊',
    team_small: '第1小隊',
    monastery: '',
    real_name: '',
    dharma_name: '',
    action_type: '新增',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    need_help: false,
    memo: ''
  });
  
  // 建立 Supabase 客戶端
  const [supabase] = useState(() => createClient());
  const FAKE_DOMAIN = "@my-notes.com";

  // === [修正] 轉碼工具 (使用 Hex 編碼解決亂碼問題) ===
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

  // 取得純姓名 (移除後四碼)
  const getDisplayNameOnly = (email: string) => {
    const fullName = decodeName(email);
    if (fullName.length > 4 && !isNaN(Number(fullName.slice(-4)))) {
      return fullName.slice(0, -4);
    }
    return fullName;
  };

  // 取得身分證後四碼
  const getIdLast4FromEmail = (email: string) => {
    if (!email) return '';
    const fullName = decodeName(email);
    if (fullName.length > 4 && !isNaN(Number(fullName.slice(-4)))) {
      return fullName.slice(-4);
    }
    return '';
  };

  const isExpired = (endDate: string, endTime: string) => {
    if (!endDate) return false;
    const endDateTimeStr = `${endDate}T${endTime || '23:59:59'}`;
    const endDateTime = new Date(endDateTimeStr);
    const now = new Date();
    return endDateTime < now;
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const currentName = getDisplayNameOnly(user.email || '');
        setFormData(prev => ({ ...prev, real_name: currentName }));
        fetchNotes(user);
      }
    };
    getUser();
  }, []);

  const fetchNotes = async (targetUser: any = user) => {
    if (!targetUser || !targetUser.email) return;

    const queryName = getDisplayNameOnly(targetUser.email);
    const queryID2 = getIdLast4FromEmail(targetUser.email);

    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('real_name', queryName)
        .eq('id_2', queryID2)
        // @ts-ignore
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('讀取失敗:', error);
      } else {
        if (data) setNotes(data);
      }
    } catch (err) {
      console.error('連線錯誤:', err);
    }
  };

  const recordLogin = async (name: string, action: string = '登入') => {
    try {
      await supabase.from('login_history').insert([
        { real_name: name, action: action }
      ]);
    } catch (e) {
      console.error('紀錄登入失敗', e);
    }
  };

  const handleSubmit = async () => {
    if (!formData.monastery || !formData.real_name || !formData.action_type || 
        !formData.start_date || !formData.start_time || !formData.end_date || !formData.end_time) {
      return alert('請確認所有必填欄位皆已填寫');
    }

    if (formData.monastery.length > 2) return alert('「精舍」欄位限填2個字');
    if (formData.dharma_name && formData.dharma_name.length > 2) return alert('「法名」欄位限填2個字');
    
    // 取得 ID 後四碼
    const currentId2 = getIdLast4FromEmail(user?.email || '');

    if (!currentId2) {
      return alert('系統錯誤：無法抓取身分證後四碼，請嘗試重新登入。');
    }

    const insertData = {
      ...formData,
      id_2: currentId2, // 寫入身分證後四碼
      content: `【${formData.action_type}】${formData.team_big}-${formData.team_small} ${formData.real_name}` 
    };

    const { error } = await supabase.from('notes').insert([insertData]);
    if (!error) {
      alert('資料送出成功！');
      setFormData({
        team_big: '觀音隊',
        team_small: '第1小隊',
        monastery: '',
        real_name: getDisplayNameOnly(user.email || ''),
        dharma_name: '',
        action_type: '新增',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        need_help: false,
        memo: ''
      });
      fetchNotes(user);
      setActiveTab('history');
    } else {
      // @ts-ignore
      alert('寫入失敗：' + error.message);
    }
  };

  const handleSignUp = async () => {
    if (!username || !idLast4 || !password) return alert("請輸入姓名、身分證後四碼與密碼");
    if (idLast4.length !== 4) return alert("身分證後四碼必須為 4 位數字");

    setLoading(true);
    const uniqueId = username + idLast4;
    const email = encodeName(uniqueId) + FAKE_DOMAIN; 
    
    // 註冊時同時寫入 display_name
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          display_name: username, // 給程式讀取用
          full_name: username,    // 給 Supabase 後台顯示用
          id_last4: idLast4
        }
      }
    });
    
    if (error) alert('註冊失敗：' + error.message);
    else {
      alert('註冊成功！系統已為您登入。');
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setFormData(prev => ({ ...prev, real_name: username }));
      fetchNotes(user);
      await recordLogin(uniqueId, '註冊');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!username || !idLast4 || !password) return alert("請輸入姓名、身分證後四碼與密碼");
    
    setLoading(true);
    const uniqueId = username + idLast4;
    const email = encodeName(uniqueId) + FAKE_DOMAIN;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      // @ts-ignore
      alert('登入失敗：' + error.message);
    } else {
      setUser(data.user);
      setFormData(prev => ({ ...prev, real_name: username }));
      fetchNotes(data.user);
      await recordLogin(uniqueId, '登入');
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotes([]);
    setUsername('');
    setIdLast4('');
    setPassword('');
    setActiveTab('form');
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center py-10 px-4 font-sans text-gray-900">
      <h1 className="text-3xl font-bold text-amber-900 mb-8 tracking-wide">一一報名系統</h1>

      {!user ? (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-amber-200">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-700">使用者登入</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">姓名</label>
              <input
                type="text"
                placeholder="例如：王小明"
                value={username}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">身分證後四碼</label>
              <input
                type="text"
                maxLength={4}
                placeholder="例如：1234 (避免同名混淆)"
                value={idLast4}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                onChange={(e) => setIdLast4(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">密碼</label>
              <input
                type="password"
                placeholder="請輸入密碼"
                value={password}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-amber-700 text-white py-3 rounded-lg font-medium hover:bg-amber-800 transition shadow-sm"
            >
              {loading ? '...' : '登入'}
            </button>
            <button 
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 bg-white text-amber-700 border border-amber-300 py-3 rounded-lg font-medium hover:bg-amber-50 transition"
            >
              註冊
            </button>
          </div>
          <p className="mt-4 text-xs text-center text-gray-400">
            *預覽模式：使用模擬資料 (請依檔案說明切換為正式版)
          </p>
        </div>
      ) : (
        <div className="w-full max-w-4xl animate-fade-in">
          {/* Header & Logout */}
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-800 font-bold">
                {(getDisplayNameOnly(user.email || '') || 'U')[0]}
              </div>
              <span className="text-gray-700 font-medium">
                嗨，{getDisplayNameOnly(user.email || '')} 
                <span className="text-xs text-gray-400 ml-1">(ID: {decodeName(user.email || '').slice(-4)})</span>
              </span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 px-3 py-1 rounded-md hover:bg-red-50 transition"
            >
              登出
            </button>
          </div>

          {/* === 頁籤切換按鈕 === */}
          <div className="flex mb-6 bg-amber-100 p-1 rounded-lg w-full">
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-3 rounded-md font-bold transition-all ${
                activeTab === 'form' 
                  ? 'bg-white text-amber-800 shadow-sm' 
                  : 'text-amber-600 hover:bg-amber-200/50'
              }`}
            >
              📝 我要報名
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 rounded-md font-bold transition-all ${
                activeTab === 'history' 
                  ? 'bg-white text-amber-800 shadow-sm' 
                  : 'text-amber-600 hover:bg-amber-200/50'
              }`}
            >
              📋 歷史登記紀錄
            </button>
          </div>

          {/* === 頁籤內容：表單 === */}
          {activeTab === 'form' && (
            <div className="bg-white p-8 rounded-xl shadow-md border border-amber-100 mb-8 animate-fade-in">
              <h3 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-2 border-b border-amber-100 pb-4">
                🙏 發心報名資料
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* 1. 大隊 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">1. 大隊</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    value={formData.team_big}
                    onChange={(e) => setFormData({...formData, team_big: e.target.value})}
                  >
                    <option value="觀音隊">觀音隊</option>
                    <option value="文殊隊">文殊隊</option>
                    <option value="普賢隊">普賢隊</option>
                    <option value="地藏隊">地藏隊</option>
                  </select>
                </div>

                {/* 2. 小隊 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">2. 小隊</label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    value={formData.team_small}
                    onChange={(e) => setFormData({...formData, team_small: e.target.value})}
                  >
                    <option value="第1小隊">第1小隊</option>
                    <option value="第2小隊">第2小隊</option>
                    <option value="第3小隊">第3小隊</option>
                    <option value="第4小隊">第4小隊</option>
                  </select>
                </div>

                {/* 3. 精舍 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">3. 精舍 <span className="text-red-500">* (限2字)</span></label>
                  <input
                    type="text"
                    maxLength={2}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    value={formData.monastery}
                    onChange={(e) => setFormData({...formData, monastery: e.target.value})}
                  />
                </div>

                {/* 4. 姓名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">4. 姓名 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    readOnly
                    className="w-full p-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                    value={formData.real_name}
                  />
                </div>

                {/* 5. 法名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">5. 法名 <span className="text-gray-400">(限2字)</span></label>
                  <input
                    type="text"
                    maxLength={2}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    value={formData.dharma_name}
                    onChange={(e) => setFormData({...formData, dharma_name: e.target.value})}
                  />
                </div>

                {/* 6. 新增異動 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">6. 新增異動 <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    value={formData.action_type}
                    onChange={(e) => setFormData({...formData, action_type: e.target.value})}
                  >
                    <option value="新增">新增</option>
                    <option value="異動">異動</option>
                  </select>
                </div>

                {/* 7, 8. 發心起 日/時 */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">7, 8. 發心起日/時 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                    <input
                      type="time"
                      className="w-32 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      value={formData.start_time}
                      onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                    />
                  </div>
                </div>

                {/* 9, 10. 發心迄 日/時 */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">9, 10. 發心迄日/時 <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      value={formData.end_date}
                      onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    />
                    <input
                      type="time"
                      className="w-32 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                      value={formData.end_time}
                      onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                    />
                  </div>
                </div>

                {/* 11. 是否需要協助 */}
                <div className="md:col-span-2 lg:col-span-4">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition w-full md:w-auto">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                      checked={formData.need_help}
                      onChange={(e) => setFormData({...formData, need_help: e.target.checked})}
                    />
                    <span className="text-gray-700 font-medium">11. 是否需要協助報名 (是)</span>
                  </label>
                </div>

                {/* 12. 想對師父說的話 */}
                <div className="md:col-span-2 lg:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">12. 想對師父說的話</label>
                  <textarea
                    placeholder="請在此輸入..."
                    rows={2}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900"
                    value={formData.memo}
                    onChange={(e) => setFormData({...formData, memo: e.target.value})}
                  />
                </div>

              </div>

              <button 
                onClick={handleSubmit}
                className="w-full bg-amber-700 text-white py-4 rounded-lg font-bold hover:bg-amber-800 transition shadow-lg text-lg mt-8"
              >
                送出發心資料
              </button>
            </div>
          )}

          {/* === 頁籤內容：歷史紀錄 (卡片式) === */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.map((note) => {
                  const completed = isExpired(note.end_date, note.end_time);
                  return (
                    <div key={note.id} className={`bg-white p-5 rounded-xl shadow-sm border transition relative overflow-hidden ${completed ? 'border-gray-200 bg-gray-50/50' : 'border-amber-100 hover:border-amber-300'}`}>
                      {/* 已圓滿標籤 */}
                      {completed && (
                        <div className="absolute top-0 right-0 bg-gray-200 text-gray-500 text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                          已圓滿
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-2">
                           <span className={`text-xs px-2 py-1 rounded-full text-white ${
                             completed 
                               ? 'bg-gray-400' 
                               : note.action_type === '新增' ? 'bg-blue-500' : 'bg-orange-500'
                           }`}>
                             {note.action_type}
                           </span>
                           <h4 className={`font-bold text-lg ${completed ? 'text-gray-500' : 'text-amber-900'}`}>
                             {note.team_big} - {note.team_small}
                           </h4>
                         </div>
                      </div>
                      
                      <div className="text-sm text-gray-700 space-y-2">
                         <div className="grid grid-cols-2 gap-2">
                           <p><span className="text-gray-400">精舍：</span>{note.monastery}</p>
                           <p><span className="text-gray-400">姓名：</span>{note.real_name}</p>
                           <p><span className="text-gray-400">法名：</span>{note.dharma_name || '-'}</p>
                           <p><span className="text-gray-400">協助：</span>{note.need_help ? '是' : '否'}</p>
                         </div>
                         
                         <div className="border-t border-dashed border-gray-200 pt-2 mt-2">
                           <p className="flex flex-col sm:flex-row sm:gap-2">
                             <span className="text-gray-400 whitespace-nowrap">起：</span>
                             <span className={completed ? 'text-gray-500' : 'text-gray-800'}>
                               {note.start_date} {note.start_time}
                             </span>
                           </p>
                           <p className="flex flex-col sm:flex-row sm:gap-2">
                             <span className="text-gray-400 whitespace-nowrap">迄：</span>
                             <span className={completed ? 'text-gray-500' : 'text-gray-800'}>
                               {note.end_date} {note.end_time}
                             </span>
                           </p>
                         </div>

                         {note.memo && (
                           <div className="bg-amber-50 p-2 rounded text-xs text-gray-600 mt-2">
                             <span className="font-bold text-amber-700">想說的話：</span>{note.memo}
                           </div>
                         )}
                      </div>
                      
                      <p className="text-xs text-right text-gray-300 mt-3">
                        登記於：{new Date(note.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
              {notes.length === 0 && (
                <div className="text-center py-12 bg-white/50 rounded-xl border border-dashed border-gray-300">
                  <p className="text-gray-500">尚無登記紀錄</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}