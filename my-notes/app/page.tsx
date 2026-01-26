'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ==========================================
// [⚠️ Vercel 部署設定指南]
//
// 1. 在 Vercel 安裝依賴: npm install @supabase/supabase-js
// 2. 解除下方 [A] 正式引用 的註解
// 3. 刪除或註解掉 [B] 預覽用替代定義
// 4. 確保 Vercel 的 Environment Variables 有設定 URL 和 KEY
// ==========================================

// --- [A] 正式引用 (部署時請解除註解) ---
// import { createClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
// --- [B] 預覽用替代定義 (部署時請刪除此區塊) ---

// ------------------------------------------------

// --- 全域變數 ---
let mockUser: any = null;
let mockDb: any = {
  notes: [],
  bulletins: [{ id: 1, content: '🎉 歡迎使用一一報名系統！', image_url: '', created_at: new Date().toISOString() }],
  user_permissions: [],
  users: [],
  login_history: [],
  system_options: [
    { id: 1, category: 'team_big', value: '觀音隊' }, { id: 2, category: 'team_big', value: '文殊隊' },
    { id: 3, category: 'team_big', value: '普賢隊' }, { id: 4, category: 'team_big', value: '地藏隊' }, { id: 5, category: 'team_big', value: '彌勒隊' },
    { id: 6, category: 'team_small', value: '第1小隊' }, { id: 7, category: 'team_small', value: '第2小隊' },
    { id: 8, category: 'team_small', value: '第3小隊' }, { id: 9, category: 'team_small', value: '第4小隊' }, { id: 10, category: 'team_small', value: '第5小隊' }
  ]
};

// 建立 Supabase 客戶端
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && key && !url.includes('your-project')) {
    return createClient(url, key);
  }
  return null; // 回傳 null 代表使用模擬模式
};

export default function RegistrationApp() {
  const [notes, setNotes] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const [user, setUser] = useState<any>(null);
  
  // 選項 State (預設給一些值，避免空白)
  const [teamBigOptions, setTeamBigOptions] = useState<any[]>(mockDb.system_options.filter((o:any)=>o.category==='team_big'));
  const [teamSmallOptions, setTeamSmallOptions] = useState<any[]>(mockDb.system_options.filter((o:any)=>o.category==='team_small'));
  
  const [newOptionValue, setNewOptionValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [username, setUsername] = useState('');
  const [idLast4, setIdLast4] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'admin_data' | 'admin_users' | 'admin_settings' | 'bulletin'>('bulletin');
  const [filterMonth, setFilterMonth] = useState('');

  const [bulletinText, setBulletinText] = useState('');
  const [bulletinImage, setBulletinImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdTargetUser, setPwdTargetUser] = useState<any>(null);

  const [addUserName, setAddUserName] = useState('');
  const [addUserLast4, setAddUserLast4] = useState('');
  const [addUserPwd, setAddUserPwd] = useState('');

  const [formData, setFormData] = useState({
    team_big: '', team_small: '', monastery: '', real_name: '', dharma_name: '',
    action_type: '新增', start_date: '', start_time: '', end_date: '', end_time: '',
    need_help: false, memo: ''
  });
  
  const supabase = getSupabase();
  const FAKE_DOMAIN = "@my-notes.com";

  // === Utils ===
  const encodeName = (name: string) => {
    try { let hex = ''; for (let i = 0; i < name.length; i++) hex += ('0000' + name.charCodeAt(i).toString(16)).slice(-4); return hex; } catch { return name; }
  };
  const decodeName = (email: string) => {
    try { const hex = email.split('@')[0]; let str = ''; for (let i = 0; i < hex.length; i += 4) str += String.fromCharCode(parseInt(hex.substr(i, 4), 16)); return str; } catch { return email?.split('@')[0] || ''; }
  };
  const getDisplayNameOnly = (email: string) => {
    const fullName = decodeName(email); return (fullName.length > 4 && !isNaN(Number(fullName.slice(-4)))) ? fullName.slice(0, -4) : fullName;
  };
  const getIdLast4FromEmail = (email: string) => {
    const fullName = decodeName(email); return (fullName.length > 4 && !isNaN(Number(fullName.slice(-4)))) ? fullName.slice(-4) : '';
  };
  const isExpired = (d: string, t: string) => { if(!d) return false; return new Date(`${d}T${t||'23:59:59'}`) < new Date(); };
  const getTomorrowDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const minStartDate = getTomorrowDate();

  // === Actions ===
  const handleLogout = useCallback(async () => {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setNotes([]); setBulletins([]); setUsername(''); setIdLast4(''); setPassword('');
    setIsAdmin(false); setIsLoginMode(true); setActiveTab('bulletin');
  }, [supabase]);

  const checkUserStatus = useCallback(async (email: string) => {
      if (!email || !supabase) return;
      try {
          const { data } = await supabase.from('user_permissions').select('is_admin, is_disabled').eq('email', email).single();
          if (data) {
              if (data.is_disabled) { alert('帳號已禁用'); await handleLogout(); return; }
              setIsAdmin(data.is_admin === true);
          }
      } catch (e) { console.error(e); }
  }, [supabase, handleLogout]);

  // [關鍵] 讀取選項，若資料庫為空則使用預設值
  const fetchOptions = useCallback(async () => {
    // 預設選項
    const defaultBig = mockDb.system_options.filter((o:any)=>o.category==='team_big');
    const defaultSmall = mockDb.system_options.filter((o:any)=>o.category==='team_small');

    if (!supabase) {
        setTeamBigOptions(defaultBig); setTeamSmallOptions(defaultSmall);
        setFormData(p => ({...p, team_big: defaultBig[0].value, team_small: defaultSmall[0].value}));
        return;
    }

    try {
      const { data: bigData } = await supabase.from('system_options').select('*').eq('category', 'team_big').order('created_at', { ascending: true });
      if (bigData && bigData.length > 0) {
          setTeamBigOptions(bigData);
          setFormData(p => ({...p, team_big: p.team_big || bigData[0].value}));
      } else {
          setTeamBigOptions(defaultBig); // Fallback
          setFormData(p => ({...p, team_big: p.team_big || defaultBig[0].value}));
      }

      const { data: smallData } = await supabase.from('system_options').select('*').eq('category', 'team_small').order('created_at', { ascending: true });
      if (smallData && smallData.length > 0) {
          setTeamSmallOptions(smallData);
          setFormData(p => ({...p, team_small: p.team_small || smallData[0].value}));
      } else {
          setTeamSmallOptions(defaultSmall); // Fallback
          setFormData(p => ({...p, team_small: p.team_small || defaultSmall[0].value}));
      }
    } catch (e) { console.error(e); }
  }, [supabase]);

  const handleAddOption = async (category: string) => {
      if (!newOptionValue.trim()) return alert('請輸入名稱');
      setLoading(true);
      if (supabase) {
          await supabase.from('system_options').insert([{ category, value: newOptionValue.trim() }]);
          setNewOptionValue(''); fetchOptions();
      } else {
          mockDb.system_options.push({id: Date.now(), category, value: newOptionValue.trim()});
          fetchOptions();
      }
      setLoading(false);
  };

  const handleDeleteOption = async (id: number) => {
      if(!confirm('刪除?')) return;
      if (supabase) { await supabase.from('system_options').delete().eq('id', id); fetchOptions(); }
      else { mockDb.system_options = mockDb.system_options.filter((o:any)=>o.id!==id); fetchOptions(); }
  };

  const exportToExcel = () => {
    const data = filterMonth ? notes.filter(n => n.start_date.startsWith(filterMonth)) : notes;
    if (data.length === 0) return alert("無資料");
    const csvContent = "\ufeff" + ["大隊,小隊,精舍,姓名,狀態,日期,填表人"].join(',') + '\n' + 
        data.map(n => `${n.team_big},${n.team_small},${n.monastery},${n.real_name},${n.action_type},${n.start_date},${n.sign_name}`).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'export.csv';
    link.click();
  };

  const handleToggleUserDisabled = async (email: string, status: boolean) => {
      if(supabase) { await supabase.from('user_permissions').update({ is_disabled: !status }).eq('email', email); fetchAllUsers(); }
  };

  const fetchAllUsers = useCallback(async () => {
    if (!supabase) return;
    const { data: pData } = await supabase.from('user_permissions').select('*').order('created_at', { ascending: false });
    const { data: nData } = await supabase.from('notes').select('sign_name, real_name, dharma_name');
    if (pData) {
       setAllUsers(pData.map((u: any) => {
           // 模糊比對填表人姓名 (因為 sign_name 包含 ID)
           const count = (nData || []).filter((n:any) => n.sign_name && n.sign_name.includes(u.user_name)).length;
           const dharma = (nData || []).find((n:any) => n.real_name === u.user_name)?.dharma_name || '';
           return { ...u, display_name: u.user_name, dharma, count };
       }));
    }
  }, [supabase]);

  useEffect(() => { if (activeTab === 'admin_users' && isAdmin) fetchAllUsers(); }, [activeTab, isAdmin, fetchAllUsers]);

  // Load Data
  useEffect(() => {
    const init = async () => {
        if (!supabase) { // Mock Mode
            setNotes(mockDb.notes); setBulletins(mockDb.bulletins); fetchOptions();
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if(user) {
            const name = getDisplayNameOnly(user.email||'');
            setFormData(p => ({...p, real_name: name}));
            // Fetch Notes
            const { data: n } = await supabase.from('notes').select('*').order('start_date', {ascending:true});
            if(n) setNotes(n);
            // Fetch Bulletins
            const { data: b } = await supabase.from('bulletins').select('*').order('created_at', {ascending:false});
            if(b) setBulletins(b);
            
            fetchOptions();
            checkUserStatus(user.email||'');
        }
    };
    init();
  }, [supabase, fetchOptions, checkUserStatus]);

  // Handlers
  const handleLogin = async () => {
     if(!supabase) { alert('預覽模式僅供展示'); return; }
     const email = encodeName(username+idLast4)+FAKE_DOMAIN;
     const { data, error } = await supabase.auth.signInWithPassword({ email, password });
     if(error) alert('登入失敗'); else { setUser(data.user); checkUserStatus(email); }
  };
  
  const handleSignUp = async () => {
     if(!supabase) { alert('預覽模式無法註冊'); return; }
     const email = encodeName(username+idLast4)+FAKE_DOMAIN;
     const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: username, id_last4: idLast4 } } });
     if(error) alert(error.message); else { alert('註冊成功'); window.location.reload(); }
  };

  const handleAdminAddUser = async () => {
     if(!supabase) return;
     const email = encodeName(addUserName+addUserLast4)+FAKE_DOMAIN;
     // 注意: 這裡使用 signUp 會導致管理員被登出，這是 Supabase Client 的限制
     // 若已執行 SQL Trigger，資料會自動寫入，不需額外 insert
     const { error } = await supabase.auth.signUp({ email, password: addUserPwd, options: { data: { display_name: addUserName, id_last4: addUserLast4 } } });
     if(error) alert(error.message); else { alert('建立成功 (將自動登入新帳號)'); window.location.reload(); }
  };

  const handleSubmit = async () => {
    if(!user) return;
    if(formData.start_date < minStartDate) return alert('日期錯誤');
    const signName = `${getDisplayNameOnly(user.email||'')} (${getIdLast4FromEmail(user.email||'')})`;
    if(supabase) {
        const { error } = await supabase.from('notes').insert([{...formData, user_id: user.id, id_2: getIdLast4FromEmail(user.email||''), sign_name: signName }]);
        if(!error) { alert('成功'); window.location.reload(); }
    } else {
        alert('預覽模式無法寫入');
    }
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center py-10 px-4 font-sans text-gray-900">
      <h1 className="text-3xl font-bold text-amber-900 mb-8 tracking-wide">一一報名系統</h1>

      {!user ? (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-amber-200">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-700">{isLoginMode ? '登入' : '註冊'}</h2>
          <div className="space-y-4">
            <input className="w-full p-3 border rounded" placeholder="姓名" value={username} onChange={e=>setUsername(e.target.value)} />
            <input className="w-full p-3 border rounded" placeholder="ID後四碼" maxLength={4} value={idLast4} onChange={e=>setIdLast4(e.target.value)} />
            <input className="w-full p-3 border rounded" type="password" placeholder="密碼" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div className="mt-6 flex flex-col gap-2">
             <button onClick={isLoginMode ? handleLogin : handleSignUp} className="w-full bg-amber-700 text-white py-3 rounded">{isLoginMode ? '登入' : '註冊'}</button>
             <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm text-gray-500 underline text-center">{isLoginMode ? '沒有帳號？註冊' : '已有帳號？登入'}</button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl animate-fade-in">
           {/* Header */}
           <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-amber-100">
             <div className="font-bold text-gray-700">嗨，{getDisplayNameOnly(user.email||'')} {isAdmin && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs">管理員</span>}</div>
             <button onClick={handleLogout} className="text-sm text-red-500 border px-3 py-1 rounded">登出</button>
           </div>
           
           {/* Tabs */}
           <div className="flex mb-6 bg-amber-100 p-1 rounded-lg w-full overflow-x-auto">
             {['bulletin','form','history'].map(t => (
                 <button key={t} onClick={()=>setActiveTab(t as any)} className={`flex-1 py-3 px-2 rounded-md ${activeTab===t?'bg-white shadow-sm':'text-amber-600'}`}>{t==='bulletin'?'公告':t==='form'?'報名':'紀錄'}</button>
             ))}
             {isAdmin && ['admin_data','admin_users','admin_settings'].map(t => (
                 <button key={t} onClick={()=>setActiveTab(t as any)} className={`flex-1 py-3 px-2 rounded-md ${activeTab===t?'bg-white shadow-sm':'text-amber-600'}`}>{t==='admin_data'?'資料':t==='admin_users'?'用戶':'設定'}</button>
             ))}
           </div>

           {/* Panels */}
           {activeTab === 'bulletin' && <div className="space-y-4">{bulletins.map(b=><div key={b.id} className="bg-white p-6 rounded shadow"><p>{b.content}</p></div>)}</div>}

           {activeTab === 'form' && (
             <div className="bg-white p-6 rounded shadow border border-amber-200">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1"><label className="text-sm">大隊*</label><select className="border p-2 rounded" value={formData.team_big} onChange={e=>setFormData({...formData, team_big:e.target.value})}>{teamBigOptions.map(o=><option key={o.id} value={o.value}>{o.value}</option>)}</select></div>
                  <div className="flex flex-col gap-1"><label className="text-sm">小隊*</label><select className="border p-2 rounded" value={formData.team_small} onChange={e=>setFormData({...formData, team_small:e.target.value})}>{teamSmallOptions.map(o=><option key={o.id} value={o.value}>{o.value}</option>)}</select></div>
                  {/* ... other inputs simplified for brevity but functional ... */}
                  <div className="flex flex-col gap-1"><label className="text-sm">精舍*</label><input className="border p-2 rounded" value={formData.monastery} onChange={e=>setFormData({...formData, monastery:e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-sm">姓名*</label><input className="border p-2 rounded" value={formData.real_name} onChange={e=>setFormData({...formData, real_name:e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-sm">法名</label><input className="border p-2 rounded" value={formData.dharma_name} onChange={e=>setFormData({...formData, dharma_name:e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-sm">動作*</label><select className="border p-2 rounded" value={formData.action_type} onChange={e=>setFormData({...formData, action_type:e.target.value})}><option value="新增">新增</option><option value="異動">異動</option></select></div>
                  <div className="lg:col-span-2 flex flex-col gap-1"><label className="text-sm">起日/時*</label><div className="flex gap-2"><input type="date" className="border p-2 rounded flex-1" value={formData.start_date} onChange={e=>setFormData({...formData, start_date:e.target.value})} /><input type="time" className="border p-2 rounded flex-1" value={formData.start_time} onChange={e=>setFormData({...formData, start_time:e.target.value})} /></div></div>
                  <div className="lg:col-span-2 flex flex-col gap-1"><label className="text-sm">迄日/時*</label><div className="flex gap-2"><input type="date" className="border p-2 rounded flex-1" value={formData.end_date} onChange={e=>setFormData({...formData, end_date:e.target.value})} /><input type="time" className="border p-2 rounded flex-1" value={formData.end_time} onChange={e=>setFormData({...formData, end_time:e.target.value})} /></div></div>
                  <div className="md:col-span-4"><label className="flex items-center gap-2"><input type="checkbox" checked={formData.need_help} onChange={e=>setFormData({...formData, need_help:e.target.checked})} /> 需協助報名</label></div>
                  <div className="md:col-span-4"><textarea className="w-full border p-2 rounded" placeholder="備註" value={formData.memo} onChange={e=>setFormData({...formData, memo:e.target.value})}></textarea></div>
               </div>
               <button onClick={handleSubmit} className="w-full bg-amber-700 text-white py-3 rounded mt-6">送出</button>
             </div>
           )}

           {activeTab === 'history' && (
             <div className="space-y-4">
                {notes.filter(n => n.user_id === user.id).map(n => (
                   <div key={n.id} className="bg-white p-4 rounded shadow border">
                      <div className="font-bold">{n.team_big} - {n.team_small}</div>
                      <div className="text-sm">{n.start_date} ~ {n.end_date}</div>
                      <div className="text-xs text-gray-400 mt-2">填表: {n.sign_name}</div>
                   </div>
                ))}
             </div>
           )}
           
           {activeTab === 'admin_settings' && isAdmin && (
              <div className="bg-white p-6 rounded shadow grid grid-cols-2 gap-8">
                 <div>
                    <h4 className="font-bold mb-2">大隊選項</h4>
                    <ul>{teamBigOptions.map(o=><li key={o.id} className="flex justify-between border-b p-1"><span>{o.value}</span><button onClick={()=>handleDeleteOption(o.id)} className="text-red-500 text-xs">刪</button></li>)}</ul>
                    <div className="flex mt-2 gap-1"><input className="border p-1 flex-1" placeholder="新增..." value={selectedCategory==='team_big'?newOptionValue:''} onChange={e=>{setNewOptionValue(e.target.value);setSelectedCategory('team_big')}} /><button onClick={()=>handleAddOption('team_big')} className="bg-gray-200 px-2">+</button></div>
                 </div>
                 <div>
                    <h4 className="font-bold mb-2">小隊選項</h4>
                    <ul>{teamSmallOptions.map(o=><li key={o.id} className="flex justify-between border-b p-1"><span>{o.value}</span><button onClick={()=>handleDeleteOption(o.id)} className="text-red-500 text-xs">刪</button></li>)}</ul>
                    <div className="flex mt-2 gap-1"><input className="border p-1 flex-1" placeholder="新增..." value={selectedCategory==='team_small'?newOptionValue:''} onChange={e=>{setNewOptionValue(e.target.value);setSelectedCategory('team_small')}} /><button onClick={()=>handleAddOption('team_small')} className="bg-gray-200 px-2">+</button></div>
                 </div>
              </div>
           )}

           {activeTab === 'admin_data' && isAdmin && (
              <div className="bg-white p-6 rounded shadow overflow-x-auto">
                 <div className="flex justify-between mb-4"><h3 className="font-bold">資料列表</h3><button onClick={exportToExcel} className="bg-green-600 text-white px-3 py-1 rounded text-sm">匯出</button></div>
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50"><tr><th className="p-2">大隊</th><th className="p-2">姓名</th><th className="p-2">日期</th><th className="p-2">填表人</th></tr></thead>
                    <tbody>{notes.map(n=><tr key={n.id} className="border-b"><td className="p-2">{n.team_big}</td><td className="p-2">{n.real_name}</td><td className="p-2">{n.start_date}</td><td className="p-2 text-blue-500">{n.sign_name}</td></tr>)}</tbody>
                 </table>
              </div>
           )}

           {activeTab === 'admin_users' && isAdmin && (
              <div className="bg-white p-6 rounded shadow">
                 <div className="mb-6 p-4 bg-gray-50 rounded">
                    <h4 className="font-bold text-sm mb-2">新增使用者 (自動產生UID)</h4>
                    <div className="flex gap-2">
                       <input placeholder="姓名" className="border p-1 rounded" value={addUserName} onChange={e=>setAddUserName(e.target.value)} />
                       <input placeholder="ID後4碼" className="border p-1 rounded" value={addUserLast4} onChange={e=>setAddUserLast4(e.target.value)} />
                       <input placeholder="密碼" className="border p-1 rounded" value={addUserPwd} onChange={e=>setAddUserPwd(e.target.value)} />
                       <button onClick={handleAdminAddUser} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">新增</button>
                    </div>
                 </div>
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50"><tr><th className="p-2">姓名(法名)</th><th className="p-2">ID</th><th className="p-2">狀態</th><th className="p-2 text-right">筆數</th><th className="p-2 text-right">操作</th></tr></thead>
                    <tbody>
                       {allUsers.map(u=>(
                          <tr key={u.id} className="border-b">
                             <td className="p-2">{u.display_name} {u.dharma?`(${u.dharma})`:''}</td>
                             <td className="p-2">{u.id_last4}</td>
                             <td className="p-2">{u.is_disabled?'禁用':'正常'}</td>
                             <td className="p-2 text-right">{u.count}</td>
                             <td className="p-2 text-right"><button onClick={()=>handleToggleUserDisabled(u.email, u.is_disabled)} className="text-blue-500">{u.is_disabled?'啟用':'禁用'}</button></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           )}

        </div>
      )}
    </div>
  );
}