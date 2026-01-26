'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ==========================================
// [⚠️ Vercel 部署檢查清單]
// 1. 確保 package.json 有安裝 "@supabase/supabase-js"
// 2. 確保 Vercel 環境變數 (Environment Variables) 已設定:
//    - NEXT_PUBLIC_SUPABASE_URL
//    - NEXT_PUBLIC_SUPABASE_ANON_KEY
// 3. 部署前，請將下方 import 的註解解除！
// ==========================================

// [步驟 1] 部署到 Vercel 時，請解除下方這一行的註解
// import { createClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
// [步驟 2] 部署到 Vercel 時，請刪除或註解掉下方這個替代函式

// --- 全域變數宣告 ---
let mockUser: any = null;
let mockDb: any = {
  notes: [],
  bulletins: [],
  user_permissions: [],
  users: [],
  login_history: [],
  system_options: []
};

// --- 安全取得 Supabase Client ---
const getSupabase = () => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (url && key) {
      return createClient(url, key);
    }
  } catch (e) {
    // 忽略環境變數讀取錯誤 (發生在某些預覽環境)
  }
  return null;
};

export default function RegistrationApp() {
  // === 1. 狀態定義 ===
  const [notes, setNotes] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const [user, setUser] = useState<any>(null);
  
  const [teamBigOptions, setTeamBigOptions] = useState<any[]>([]);
  const [teamSmallOptions, setTeamSmallOptions] = useState<any[]>([]);
  
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

  // === 2. 工具函式 ===
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
  const getTomorrowDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  };
  const minStartDate = getTomorrowDate();

  // === 3. 資料讀取函式 (Fetch Functions) ===
  // 必須定義在操作函式之前，避免 ReferenceError

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

  const fetchOptions = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: bigDataRaw } = await supabase.from('system_options').select('*').eq('category', 'team_big').order('created_at', { ascending: true });
      const bigData = bigDataRaw || [];
      setTeamBigOptions(bigData);
      
      const { data: smallDataRaw } = await supabase.from('system_options').select('*').eq('category', 'team_small').order('created_at', { ascending: true });
      const smallData = smallDataRaw || [];
      setTeamSmallOptions(smallData);
    } catch (e) { console.error(e); }
  }, [supabase]);

  const fetchBulletins = useCallback(async () => {
    if (!supabase) return;
    const { data } = await supabase.from('bulletins').select('*').order('created_at', { ascending: false });
    // [修正] 加入 || [] 避免 null 賦值給 array
    setBulletins(data || []);
  }, [supabase]);

  const fetchAllUsers = useCallback(async () => {
    if (!supabase) return;
    let pData: any[] = [];
    let nData: any[] = [];

    const { data: p } = await supabase.from('user_permissions').select('*').order('created_at', { ascending: false });
    const { data: n } = await supabase.from('notes').select('sign_name, real_name, dharma_name, id_2');
    
    // [修正] 加入 || []
    pData = p || [];
    nData = n || [];

    if (pData) {
       setAllUsers(pData.map((u: any) => {
           const userName = u.user_name || '未設定';
           const userIdLast4 = u.id_last4 || '????';
           
           const count = nData.filter((n:any) => n.id_2 === userIdLast4 && n.sign_name.includes(userName)).length;
           const note = nData.find((n:any) => n.id_2 === userIdLast4 && n.real_name === userName && n.dharma_name);
           
           return { 
             ...u, 
             display_name: userName,
             id_last4: userIdLast4, 
             dharma: note?.dharma_name || '', 
             count 
           };
       }));
    }
  }, [supabase]);

  const fetchNotes = useCallback(async () => {
      if(!supabase) return;
      const { data } = await supabase.from('notes').select('*').order('start_date', { ascending: true }).order('start_time', { ascending: true });
      // [修正] 加入 || []
      setNotes(data || []);
  }, [supabase]);

  // === 4. 操作函式 (Handlers) ===

  const handleInitializeDefaults = async () => {
      if (!confirm('確定要匯入預設選項嗎？')) return;
      if (!supabase) return;
      setLoading(true);
      const defaultBig = ['觀音隊', '文殊隊', '普賢隊', '地藏隊', '彌勒隊'];
      const defaultSmall = ['第1小隊', '第2小隊', '第3小隊', '第4小隊', '第5小隊'];
      const insertPayload = [
          ...defaultBig.map(v => ({ category: 'team_big', value: v })),
          ...defaultSmall.map(v => ({ category: 'team_small', value: v }))
      ];
      const { error } = await supabase.from('system_options').insert(insertPayload);
      if (error) alert('匯入失敗：' + error.message);
      else {
          alert('預設選項匯入成功！');
          fetchOptions();
      }
      setLoading(false);
  };

  const handleAddOption = async (category: string) => {
      if (!newOptionValue.trim()) return alert('請輸入名稱');
      if (!supabase) return;
      setLoading(true);
      const { error } = await supabase.from('system_options').insert([{ category, value: newOptionValue.trim() }]);
      if (error) alert('新增失敗: ' + error.message);
      else { setNewOptionValue(''); fetchOptions(); }
      setLoading(false);
  };

  const handleDeleteOption = async (id: number) => {
      if(!confirm('刪除?')) return;
      if (!supabase) return;
      const { error } = await supabase.from('system_options').delete().eq('id', id);
      if (error) alert('刪除失敗'); else fetchOptions();
  };

  const exportToExcel = () => {
    const data = filterMonth ? notes.filter(n => n.start_date.startsWith(filterMonth)) : notes;
    if (data.length === 0) return alert("無資料");
    const csvContent = "\ufeff" + ["大隊,小隊,精舍,姓名,身分證後四碼,法名,動作,開始日,開始時,結束日,結束時,協助,備註,登記時間,填表人,已刪除"].join(',') + '\n' + 
        data.map(n => `${n.team_big},${n.team_small},${n.monastery},${n.real_name},${n.id_2},${n.dharma_name},${n.action_type},${n.start_date},${n.start_time},${n.end_date},${n.end_time},${n.need_help?'是':'否'},"${(n.memo||'').replace(/"/g,'""')}",${n.created_at},${n.sign_name},${n.is_deleted?'是':''}`).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'export.csv';
    link.click();
  };

  const handleToggleUserDisabled = async (email: string, status: boolean) => {
      if(!supabase) return;
      const { error } = await supabase.from('user_permissions').update({ is_disabled: !status }).eq('email', email);
      if(!error) fetchAllUsers();
      else alert('更新失敗: ' + error.message);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBulletinImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePostBulletin = async () => {
    if (!bulletinText && !bulletinImage) return alert('請輸入內容');
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.from('bulletins').insert([{ content: bulletinText, image_url: bulletinImage }]);
    if (error) alert('失敗:' + error.message); else { alert('成功'); setBulletinText(''); setBulletinImage(''); fetchBulletins(); }
    setLoading(false);
  };

  const handleDeleteBulletin = async (id: number) => {
    if (!confirm('刪除?')) return;
    if (supabase) {
        const { error } = await supabase.from('bulletins').delete().eq('id', id);
        if (!error) { alert('已刪除'); fetchBulletins(); }
    }
  };

  const handleToggleDeleteNote = async (id: number, currentStatus: boolean) => {
    if (!currentStatus && !confirm('確定刪除?')) return;
    if (!supabase) return;
    setLoading(true);
    // [修正] data 可能為 null, 增加 || []
    const { data, error } = await supabase.from('notes').update({ is_deleted: !currentStatus }).eq('id', id).select();
    const result = data || [];
    if (error || result.length === 0) alert('更新失敗或無權限 (請檢查 RLS)');
    else {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, is_deleted: !currentStatus } : n));
      if (isAdmin) fetchAllUsers();
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) return alert('至少6碼');
    if (!supabase) return;
    
    if (pwdTargetUser === 'SELF') {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) alert(error.message); else alert('成功');
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(pwdTargetUser.email);
      if (error) alert('發送重設信失敗: ' + error.message);
      else alert(`已發送重設密碼信件至 ${pwdTargetUser.email}`);
    }
    setShowPwdModal(false);
  };

  const handleAdminAddUser = async () => {
     if(!addUserName || !addUserLast4 || !addUserPwd) return alert('請輸入完整資料');
     const email = encodeName(addUserName+addUserLast4)+FAKE_DOMAIN;
     
     setLoading(true);

     if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
         try {
             // 建立臨時 Client，避免管理員被登出
             // 注意: 此處在部署後會使用正式的 createClient
             const tempClient = createSupabaseClient(
                 process.env.NEXT_PUBLIC_SUPABASE_URL,
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                 { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
             );

             // 如果 createSupabaseClient 仍是預覽用的空函式，這裡會出錯，提醒用戶解除註解
             // @ts-ignore
             if (!tempClient.auth) throw new Error("請解除 createSupabaseClient 的註解並部署");

             const { data, error } = await tempClient.auth.signUp({ 
                 email: email, 
                 password: addUserPwd, 
                 options: { data: { display_name: addUserName, id_last4: addUserLast4 } } 
             });

             if (error) {
                 alert('註冊失敗: ' + error.message);
             } else {
                 alert(`使用者 ${addUserName} 已建立！(資料已自動同步)`);
                 setAddUserName('');
                 setAddUserLast4('');
                 setAddUserPwd('');
                 fetchAllUsers();
             }
         } catch(e:any) {
             alert('執行錯誤: ' + e.message);
         }
     } else {
         alert('請先設定正式環境連線');
     }
     setLoading(false);
  };

  const handleSubmit = async () => {
    if(!user) return;
    if(formData.start_date < minStartDate) return alert('日期錯誤');
    const signName = `${getDisplayNameOnly(user.email||'')} (${getIdLast4FromEmail(user.email||'')})`;
    if(supabase) {
        const { error } = await supabase.from('notes').insert([{...formData, user_id: user.id, id_2: getIdLast4FromEmail(user.email||''), sign_name: signName }]);
        if(!error) { alert('成功'); window.location.reload(); }
        else alert('失敗');
    }
  };

  const handleLogin = async () => {
    if (!supabase) return alert('請先設定環境變數');
    const email = encodeName(username+idLast4) + FAKE_DOMAIN;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) alert('登入失敗');
    else {
        setUser(data.user);
        checkUserStatus(email);
    }
  };

  const handleSignUp = async () => {
      if (!supabase) return alert('請先設定環境變數');
      const email = encodeName(username+idLast4) + FAKE_DOMAIN;
      const { data, error } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { data: { display_name: username, id_last4: idLast4 } } 
      });
      if(error) alert(error.message);
      else {
          alert('註冊成功！');
          window.location.reload();
      }
  };

  // === 5. Effects (Hooks) ===
  useEffect(() => { 
      if (isAdmin) {
          if (activeTab === 'admin_users') fetchAllUsers();
          if (activeTab === 'admin_settings') fetchOptions();
      }
  }, [activeTab, isAdmin, fetchAllUsers, fetchOptions]);

  useEffect(() => {
    const init = async () => {
        if (!supabase) return;
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if(user) {
            const name = getDisplayNameOnly(user.email||'');
            setFormData(p => ({...p, real_name: name}));
            fetchNotes();
            fetchBulletins();
            fetchOptions();
            checkUserStatus(user.email||'');
        }
    };
    init();
  }, [fetchNotes, fetchBulletins, fetchOptions, checkUserStatus, supabase]);

  // UI
  const openPwdModal = (target: any) => {
    setPwdTargetUser(target);
    setNewPassword('');
    setShowPwdModal(true);
  };

  if (!supabase) {
      return <div className="p-10 text-center text-red-500 font-bold">⚠️ 系統未連接資料庫。請在 Vercel 設定環境變數。</div>;
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center py-10 px-4 font-sans text-gray-900">
      <h1 className="text-3xl font-bold text-amber-900 mb-8 tracking-wide">一一報名系統 (v2.3)</h1>

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
             <div className="flex gap-2">
               <button onClick={() => { setPwdTargetUser('SELF'); setShowPwdModal(true); }} className="text-sm border px-3 py-1 rounded">修改密碼</button>
               <button onClick={handleLogout} className="text-sm text-red-500 border px-3 py-1 rounded">登出</button>
             </div>
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
           {activeTab === 'bulletin' && <div className="space-y-4">
               {isAdmin && (
                  <div className="bg-white p-4 rounded shadow border border-orange-200 mb-4">
                    <textarea value={bulletinText} onChange={e => setBulletinText(e.target.value)} className="w-full border p-2 mb-2" placeholder="公告內容..."></textarea>
                    <div className="flex justify-between">
                       <input type="file" ref={fileInputRef} onChange={handleImageUpload} />
                       <button onClick={handlePostBulletin} className="bg-orange-500 text-white px-4 py-2 rounded">發布</button>
                    </div>
                  </div>
               )}
               {bulletins.map(b=><div key={b.id} className="bg-white p-6 rounded shadow relative">{isAdmin && <button onClick={() => handleDeleteBulletin(b.id)} className="absolute top-4 right-4 text-red-500">刪除</button>} <p>{b.content}</p></div>)}
           </div>}

           {activeTab === 'form' && (
             <div className="bg-white p-6 rounded shadow border border-amber-200">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-1"><label className="text-sm">1. 大隊*</label>
                  <select className="border p-2 rounded" value={formData.team_big} onChange={e=>setFormData({...formData, team_big:e.target.value})}>
                      <option value="">請選擇...</option>
                      {teamBigOptions.map(o=><option key={o.id} value={o.value}>{o.value}</option>)}
                  </select>
                  </div>
                  <div className="flex flex-col gap-1"><label className="text-sm">2. 小隊*</label>
                  <select className="border p-2 rounded" value={formData.team_small} onChange={e=>setFormData({...formData, team_small:e.target.value})}>
                      <option value="">請選擇...</option>
                      {teamSmallOptions.map(o=><option key={o.id} value={o.value}>{o.value}</option>)}
                  </select>
                  </div>
                  <div className="flex flex-col gap-1"><label className="text-sm">3. 精舍* (限2字)</label><input className="border p-2 rounded" value={formData.monastery} onChange={e=>setFormData({...formData, monastery:e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-sm">4. 姓名*</label><input className="border p-2 rounded" value={formData.real_name} onChange={e=>setFormData({...formData, real_name:e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-sm">5. 法名</label><input className="border p-2 rounded" value={formData.dharma_name} onChange={e=>setFormData({...formData, dharma_name:e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-sm">6. 新增異動*</label><select className="border p-2 rounded" value={formData.action_type} onChange={e=>setFormData({...formData, action_type:e.target.value})}><option value="新增">新增</option><option value="異動">異動</option></select></div>
                  <div className="lg:col-span-2 flex flex-col gap-1"><label className="text-sm">7. 起日/時*</label><div className="flex gap-2"><input type="date" className="border p-2 rounded flex-1" value={formData.start_date} onChange={e=>setFormData({...formData, start_date:e.target.value})} /><input type="time" className="border p-2 rounded flex-1" value={formData.start_time} onChange={e=>setFormData({...formData, start_time:e.target.value})} /></div></div>
                  <div className="lg:col-span-2 flex flex-col gap-1"><label className="text-sm">8. 迄日/時*</label><div className="flex gap-2"><input type="date" className="border p-2 rounded flex-1" value={formData.end_date} onChange={e=>setFormData({...formData, end_date:e.target.value})} /><input type="time" className="border p-2 rounded flex-1" value={formData.end_time} onChange={e=>setFormData({...formData, end_time:e.target.value})} /></div></div>
                  <div className="md:col-span-4"><label className="flex items-center gap-2"><input type="checkbox" checked={formData.need_help} onChange={e=>setFormData({...formData, need_help:e.target.checked})} /> 9. 需協助報名 (是)</label></div>
                  <div className="md:col-span-4"><textarea className="w-full border p-2 rounded" placeholder="10. 備註" value={formData.memo} onChange={e=>setFormData({...formData, memo:e.target.value})}></textarea></div>
               </div>
               <button onClick={handleSubmit} className="w-full bg-amber-700 text-white py-3 rounded mt-6">送出</button>
             </div>
           )}

           {activeTab === 'history' && (
             <div className="space-y-4">
                {notes.filter(n => n.user_id === user.id).map(n => (
                   <div key={n.id} className={`bg-white p-4 rounded shadow border ${n.is_deleted ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between font-bold mb-2"><span>{n.team_big} - {n.team_small}</span><span>{n.action_type}{n.is_deleted && ' (刪)'}</span></div>
                      <div className="text-sm grid grid-cols-2 gap-2">
                        <p>姓名: {n.real_name}</p><p>法名: {n.dharma_name}</p>
                        <p>起: {n.start_date} {n.start_time}</p><p>迄: {n.end_date} {n.end_time}</p>
                      </div>
                      <div className="mt-2 pt-2 border-t text-xs text-gray-500 flex justify-between items-center">
                         <span>填表人: {n.sign_name}</span>
                         <label className="flex items-center gap-1 cursor-pointer"><span className="text-red-500">刪除</span><input type="checkbox" checked={n.is_deleted} onChange={() => handleToggleDeleteNote(n.id, n.is_deleted)} /></label>
                      </div>
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
                    <button onClick={handleInitializeDefaults} className="text-xs text-blue-500 mt-2 underline">匯入預設選項</button>
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
                 {/* 使用者管理列表 */}
                 <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="p-2">登入者姓名(填表人)</th>
                            <th className="p-2">法名</th>
                            <th className="p-2">身份證ID後4碼</th>
                            <th className="p-2">修改密碼</th>
                            <th className="p-2">停用</th>
                            <th className="p-2 text-right">報名筆數</th>
                        </tr>
                    </thead>
                    <tbody>
                       {allUsers.map(u=>(
                          <tr key={u.id} className="border-b">
                             <td className="p-2">{u.display_name}</td>
                             <td className="p-2">{u.dharma || '-'}</td>
                             <td className="p-2">{u.id_last4}</td>
                             <td className="p-2">
                                <button onClick={() => { setPwdTargetUser(u); setShowPwdModal(true); }} className="text-blue-600 hover:text-blue-800 text-xs border border-blue-200 px-2 py-1 rounded bg-blue-50">重設</button>
                             </td>
                             <td className="p-2">
                                <button onClick={()=>handleToggleUserDisabled(u.email, u.is_disabled)} className={`px-2 py-1 rounded text-xs border ${u.is_disabled ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                                    {u.is_disabled ? '啟用' : '停用'}
                                </button>
                             </td>
                             <td className="p-2 text-right font-medium text-blue-600">{u.count}</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           )}

           {showPwdModal && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
                   <h3 className="font-bold mb-4">重設密碼 ({pwdTargetUser?.display_name})</h3>
                   <input type="password" placeholder="新密碼" className="w-full border p-2 mb-4 rounded" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                   <div className="flex justify-end gap-2"><button onClick={() => setShowPwdModal(false)} className="px-4 py-2 bg-gray-200 rounded">取消</button><button onClick={handleChangePassword} className="px-4 py-2 bg-blue-600 text-white rounded">確認</button></div>
                </div>
             </div>
           )}

        </div>
      )}
    </div>
  );
}