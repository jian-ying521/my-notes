'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ==========================================
// [⚠️ 部署 Vercel 必讀]
// 1. 請確保有安裝: npm install @supabase/supabase-js
// 2. 解除下方 import 的註解。
// 3. 刪除下方 [預覽用替代定義] 的區塊。
// 4. 解除下方 [正式連線函式] 的註解。
// ==========================================

// [步驟 1] 部署到 Vercel 時，請解除下方這一行的註解
// import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';



// --- 全域變數宣告 ---
let mockUser: any = null;
let mockDb: any = {
  notes: [
      { id: 1, team_big: '觀音隊', team_small: '第1小隊', monastery: '台北', real_name: '王小明', dharma_name: '寬明', action_type: '新增', start_date: '2023-10-01', start_time: '08:00', end_date: '2023-10-01', end_time: '12:00', need_help: true, memo: '模擬資料(已過期)', id_2: '1234', sign_name: '王小明 (1234)', is_deleted: false, created_at: new Date('2023-10-01T08:00:00').toISOString(), user_id: 'user-1' },
      { id: 2, team_big: '文殊隊', team_small: '第2小隊', monastery: '高雄', real_name: '李小華', dharma_name: '', action_type: '新增', start_date: '2025-12-31', start_time: '09:00', end_date: '2025-12-31', end_time: '17:00', need_help: false, memo: '未來活動測試', id_2: '5678', sign_name: '李小華 (5678)', is_deleted: false, created_at: new Date().toISOString(), user_id: 'user-2' }
  ],
  bulletins: [{ id: 1, content: '🎉 歡迎使用一一報名系統！請詳閱本期活動須知。', image_url: '', created_at: new Date().toISOString() }],
  user_permissions: [
      { id: 1, email: 'admin@example.com', uid: 'user-1', is_admin: true, is_disabled: false, user_name: 'admin', id_last4: '1234', created_at: new Date().toISOString() },
      { id: 2, email: 'user@example.com', uid: 'user-2', is_admin: false, is_disabled: false, user_name: '王小明', id_last4: '5566', created_at: new Date().toISOString() }
  ],
  users: [],
  login_history: [],
  system_options: [
    { id: 1, category: 'team_big', value: '觀音隊' }, { id: 2, category: 'team_big', value: '文殊隊' },
    { id: 3, category: 'team_big', value: '普賢隊' }, { id: 4, category: 'team_big', value: '地藏隊' }, { id: 5, category: 'team_big', value: '彌勒隊' },
    { id: 6, category: 'team_small', value: '第1小隊' }, { id: 7, category: 'team_small', value: '第2小隊' },
    { id: 8, category: 'team_small', value: '第3小隊' }, { id: 9, category: 'team_small', value: '第4小隊' }, { id: 10, category: 'team_small', value: '第5小隊' }
  ]
};

// --- [正式連線函式] (部署時請解除註解) ---
/*
const createClient = (url: string, key: string, options?: any) => {
  return createSupabaseClient(url, key, options);
};
*/
const createClient = (url: string, key: string, options?: any) => {
  return createSupabaseClient(url, key, options);
};


// --- Helper Functions ---
const getSupabase = () => {
  let url = '';
  let key = '';
  try {
    if (typeof process !== 'undefined' && process.env) {
      url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    }
  } catch (e) { }

  if (url && key && !url.includes('your-project')) {
    return createClient(url, key);
  }
  return null; 
};

// --- Component ---
export default function RegistrationApp() {
  const [notes, setNotes] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const [user, setUser] = useState<any>(null);
  
  const supabase = getSupabase(); 
  // 建立 client 實例，如果 supabase 為 null 則建立 mock client
  // 使用 useMemo 避免每次 render 都重建 client
  const client = useRef(supabase || createClient('mock','mock')).current;

  const FAKE_DOMAIN = "@my-notes.com";

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

  const [minStartDate, setMinStartDate] = useState('');

  const [formData, setFormData] = useState({
    team_big: '', team_small: '', monastery: '', real_name: '', dharma_name: '',
    action_type: '新增', start_date: '', start_time: '', end_date: '', end_time: '',
    need_help: false, memo: ''
  });
  
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
  
  // 檢查日期是否過期
  const isExpired = (d: string, t: string) => { 
      if(!d) return false; 
      // 假設 end_time 空值為當天最後一刻
      const dateTimeStr = `${d}T${t || '23:59:59'}`;
      return new Date(dateTimeStr) < new Date(); 
  };

  useEffect(() => {
    const d = new Date(); 
    d.setDate(d.getDate() + 1);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    setMinStartDate(dateStr);
  }, []);

  // === Actions (Functions) ===
  const handleLogout = useCallback(async () => {
    await client.auth.signOut();
    // 清空狀態
    setUser(null); 
    setNotes([]); 
    setBulletins([]); 
    setUsername(''); 
    setIdLast4(''); 
    setPassword('');
    setIsAdmin(false); 
    setIsLoginMode(true); 
    setActiveTab('bulletin');
  }, [client]);

  const checkUserStatus = useCallback(async (email: string) => {
      if (!email) return;
      try {
          if (!supabase) {
             if (mockDb && mockDb.user_permissions) {
               const perm = mockDb.user_permissions.find((u:any) => u.email === email);
               if (perm) {
                   if (perm.is_disabled) { alert('帳號已禁用'); await handleLogout(); return; }
                   setIsAdmin(perm.is_admin);
               }
             }
             return;
          }

          const { data } = await supabase.from('user_permissions').select('is_admin, is_disabled').eq('email', email).single();
          if (data) {
              if (data.is_disabled) { alert('帳號已禁用'); await handleLogout(); return; }
              setIsAdmin(data.is_admin === true);
          }
      } catch (e) { console.error(e); }
  }, [supabase, client, handleLogout]);

  // 讀取選項
  const fetchOptions = useCallback(async () => {
    try {
      const { data: bigDataRaw } = await client.from('system_options').select('*').eq('category', 'team_big').order('created_at', { ascending: true });
      const bigData = bigDataRaw || [];
      const finalBig = (!supabase && bigData.length === 0 && mockDb?.system_options) ? 
                       mockDb.system_options.filter((o:any)=>o.category==='team_big') : bigData;
      setTeamBigOptions(finalBig);
      
      const { data: smallDataRaw } = await client.from('system_options').select('*').eq('category', 'team_small').order('created_at', { ascending: true });
      const smallData = smallDataRaw || [];
      const finalSmall = (!supabase && smallData.length === 0 && mockDb?.system_options) ? 
                         mockDb.system_options.filter((o:any)=>o.category==='team_small') : smallData;
      setTeamSmallOptions(finalSmall);

    } catch (e) { console.error(e); }
  }, [client, supabase]);

  const fetchBulletins = async () => {
    if (!client) return;
    const { data } = await client.from('bulletins').select('*').order('created_at', { ascending: false });
    if(data) setBulletins(data);
    else if(!supabase && mockDb?.bulletins) setBulletins(mockDb.bulletins);
  };

  const fetchAllUsers = useCallback(async () => {
    let pData: any[] = [];
    let nData: any[] = [];

    if (!supabase) {
        pData = mockDb.user_permissions || [];
        nData = mockDb.notes || [];
    } else {
        const { data: p } = await supabase.from('user_permissions').select('*').order('created_at', { ascending: false });
        const { data: n } = await supabase.from('notes').select('sign_name, real_name, dharma_name, id_2');
        pData = p || [];
        nData = n || [];
    }

    if (pData) {
       setAllUsers(pData.map((u: any) => {
           const userName = u.user_name || '未設定';
           const userIdLast4 = u.id_last4 || '????';
           
           const count = (nData || []).filter((n:any) => n.id_2 === userIdLast4 && n.sign_name.includes(userName)).length;
           const note = (nData || []).find((n:any) => n.id_2 === userIdLast4 && n.real_name === userName && n.dharma_name);
           
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

  const fetchNotes = async (targetUser: any = user) => {
      if(!client) return;
      const { data } = await client.from('notes').select('*').order('start_date', { ascending: true }).order('start_time', { ascending: true });
      if(data) setNotes(data);
      else if(!supabase && mockDb?.notes) setNotes(mockDb.notes);
  };

  const handleInitializeDefaults = async () => {
      if (!confirm('確定要匯入預設選項嗎？')) return;
      setLoading(true);
      const defaultBig = ['觀音隊', '文殊隊', '普賢隊', '地藏隊', '彌勒隊'];
      const defaultSmall = ['第1小隊', '第2小隊', '第3小隊', '第4小隊', '第5小隊'];
      const insertPayload = [
          ...defaultBig.map(v => ({ category: 'team_big', value: v })),
          ...defaultSmall.map(v => ({ category: 'team_small', value: v }))
      ];
      const { error } = await client.from('system_options').insert(insertPayload);
      if (error) alert('匯入失敗：' + error.message);
      else {
          alert('預設選項匯入成功！');
          fetchOptions();
      }
      setLoading(false);
  };

  const handleAddOption = async (category: string) => {
      if (!newOptionValue.trim()) return alert('請輸入名稱');
      setLoading(true);
      if (supabase) {
          const { error } = await client.from('system_options').insert([{ category, value: newOptionValue.trim() }]);
          if (error) alert('新增失敗'); else { setNewOptionValue(''); fetchOptions(); }
      } else {
          mockDb.system_options.push({id: Date.now(), category, value: newOptionValue.trim()});
          setNewOptionValue(''); fetchOptions();
      }
      setLoading(false);
  };

  const handleDeleteOption = async (id: number) => {
      if(!confirm('刪除?')) return;
      if (supabase) {
          const { error } = await client.from('system_options').delete().eq('id', id);
          if (error) alert('刪除失敗'); else fetchOptions();
      } else {
         mockDb.system_options = mockDb.system_options.filter((o:any)=>o.id!==id); 
         fetchOptions();
      }
  };

  const exportToExcel = () => {
    const data = filterMonth ? notes.filter(n => n.start_date.startsWith(filterMonth)) : notes;
    if (data.length === 0) return alert("無資料");
    const csvContent = "\ufeff" + ["大隊,小隊,精舍,姓名,身分證後四碼,法名,動作,開始日,開始時,結束日,結束時,協助,備註,登記時間,填表人,已刪除"].join(',') + '\n' + 
        data.map(n => `${n.team_big},${n.team_small},${n.monastery},${n.real_name},${n.id_2},${n.dharma_name},${n.action_type},${n.start_date},${n.start_time},${n.end_date},${n.end_time},${n.need_help?'是':'否'},"${(n.memo||'').replace(/"/g,'""')}",${n.created_at},${n.sign_name},${n.is_deleted?'是':''}`).join('\n');
    const csvString = csvContent;
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvString], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'export.csv';
    link.click();
  };

  const handleToggleUserDisabled = async (email: string, status: boolean) => {
      if(supabase) { 
        const { error } = await client.from('user_permissions').update({ is_disabled: !status }).eq('email', email);
        if(!error) fetchAllUsers();
        else alert('更新失敗: ' + error.message);
      } else {
         mockDb.user_permissions = mockDb.user_permissions.map((u:any)=>u.email===email ? {...u, is_disabled: !status} : u);
         fetchAllUsers();
      }
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
    setLoading(true);
    if (supabase) {
        const { error } = await supabase.from('bulletins').insert([{ content: bulletinText, image_url: bulletinImage }]);
        if (error) alert('失敗:' + error.message); else { alert('成功'); setBulletinText(''); setBulletinImage(''); fetchBulletins(); }
    } else {
        alert('預覽模式發布成功');
        mockDb.bulletins.unshift({id: Date.now(), content: bulletinText, image_url: bulletinImage});
        fetchBulletins();
    }
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
    setLoading(true);
    if (supabase) {
        const { data, error } = await supabase.from('notes').update({ is_deleted: !currentStatus }).eq('id', id).select();
        if (error || (data && data.length===0)) alert('更新失敗或無權限 (請檢查 RLS)');
        else {
          setNotes(prev => prev.map(n => n.id === id ? { ...n, is_deleted: !currentStatus } : n));
          if (isAdmin) fetchAllUsers();
        }
    } else {
        mockDb.notes = mockDb.notes.map((n: any) => n.id === id ? { ...n, is_deleted: !currentStatus } : n);
        setNotes(prev => prev.map(n => n.id === id ? { ...n, is_deleted: !currentStatus } : n));
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) return alert('至少6碼');
    if (!supabase) return alert('預覽模式無法修改');
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
             // 使用 any 繞過 TypeScript 檢查
             const createClientAny = createClient as any;
             const tempClient = createClientAny(
                 process.env.NEXT_PUBLIC_SUPABASE_URL,
                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                 { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
             );

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
         alert(`[模擬] 使用者 ${addUserName} 已建立`);
         if(mockDb) {
           if(!mockDb.user_permissions) mockDb.user_permissions = [];
           mockDb.user_permissions.push({
               id: Date.now(), email, is_admin: false, is_disabled: false, 
               user_name: addUserName, id_last4: addUserLast4, uid: 'mock-new-uid', created_at: new Date().toISOString()
           });
           fetchAllUsers();
         }
     }
     setLoading(false);
  };

  const handleSubmit = async () => {
    if(!user) return;
    if(formData.start_date < minStartDate) return alert('日期錯誤');
    const signName = `${getDisplayNameOnly(user.email||'')} (${getIdLast4FromEmail(user.email||'')})`;
    if(supabase) {
        const { error } = await client.from('notes').insert([{...formData, user_id: user.id, id_2: getIdLast4FromEmail(user.email||''), sign_name: signName }]);
        if(!error) { alert('成功'); window.location.reload(); }
        else alert('失敗');
    } else if (mockDb) {
        if(!mockDb.notes) mockDb.notes = [];
        mockDb.notes.push({...formData, id: Date.now(), user_id: user.id, id_2: getIdLast4FromEmail(user.email||''), sign_name: signName, created_at: new Date().toISOString() });
        alert('[模擬] 報名成功');
        fetchNotes();
        setActiveTab('history');
    }
  };

  const handleLogin = async () => {
    if (!supabase) { // Mock login
        const email = encodeName(username+idLast4) + FAKE_DOMAIN;
        setUser({ email, id: 'mock-user' });
        checkUserStatus(email);
        return;
    }
    const email = encodeName(username+idLast4) + FAKE_DOMAIN;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if(error) alert('登入失敗');
    else {
        setUser(data.user);
        checkUserStatus(email);
    }
  };

  const handleSignUp = async () => {
      if (!supabase) return alert('預覽模式無法註冊');
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

  // Effects
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
      <h1 className="text-3xl font-bold text-amber-900 mb-8 tracking-wide">一一報名系統</h1>

      {!user ? (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-amber-200">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-700">{isLoginMode ? '登入' : '註冊'}</h2>
          <div className="space-y-4">
            <input className="w-full p-3 border rounded transition focus:ring-2 focus:ring-amber-500 outline-none" placeholder="姓名" value={username} onChange={e=>setUsername(e.target.value)} />
            <input className="w-full p-3 border rounded transition focus:ring-2 focus:ring-amber-500 outline-none" placeholder="ID後四碼" maxLength={4} value={idLast4} onChange={e=>setIdLast4(e.target.value)} />
            <input className="w-full p-3 border rounded transition focus:ring-2 focus:ring-amber-500 outline-none" type="password" placeholder="密碼" value={password} onChange={e=>setPassword(e.target.value)} />
          </div>
          <div className="mt-6 flex flex-col gap-2">
             <button onClick={isLoginMode ? handleLogin : handleSignUp} className="w-full bg-amber-700 text-white py-3 rounded hover:bg-amber-800 transition shadow">{isLoginMode ? '登入' : '註冊'}</button>
             <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-sm text-gray-500 underline text-center">{isLoginMode ? '沒有帳號？註冊' : '已有帳號？登入'}</button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl animate-fade-in p-4">
           {/* Header */}
           <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow border border-amber-100">
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${isAdmin ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                 {(getDisplayNameOnly(user.email||''))[0]}
               </div>
               <div>
                 <div className="font-bold text-gray-800">{getDisplayNameOnly(user.email||'')} {isAdmin && <span className="bg-red-500 text-white px-2 py-0.5 rounded text-xs ml-1">Admin</span>}</div>
                 <div className="text-xs text-gray-500">ID: {getIdLast4FromEmail(user.email||'')}</div>
               </div>
             </div>
             <div className="flex gap-2">
               <button onClick={() => { setPwdTargetUser('SELF'); setShowPwdModal(true); }} className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded transition">修改密碼</button>
               <button onClick={handleLogout} className="text-sm text-red-500 border border-red-200 hover:bg-red-50 px-4 py-2 rounded transition">登出</button>
             </div>
           </div>
           
           {/* Tabs */}
           <div className="flex mb-6 bg-amber-100 p-1 rounded-lg w-full overflow-x-auto shadow-inner">
             {['bulletin','form','history'].map(t => (
                 <button key={t} onClick={()=>setActiveTab(t as any)} className={`flex-1 py-3 px-2 rounded-md font-medium transition-all ${activeTab===t?'bg-white shadow-sm text-amber-800':'text-amber-600 hover:bg-amber-200/50'}`}>{t==='bulletin'?'📢 公告':t==='form'?'📝 報名':t==='history'?'📋 紀錄':''}</button>
             ))}
             {isAdmin && ['admin_data','admin_users','admin_settings'].map(t => (
                 <button key={t} onClick={()=>setActiveTab(t as any)} className={`flex-1 py-3 px-2 rounded-md font-medium transition-all ${activeTab===t?'bg-white shadow-sm text-blue-800':'text-blue-600 hover:bg-blue-100/50'}`}>{t==='admin_data'?'📊 資料':t==='admin_users'?'👥 用戶':t==='admin_settings'?'⚙️ 設定':''}</button>
             ))}
           </div>

           {/* Panels */}
           {activeTab === 'bulletin' && <div className="space-y-4">
               {isAdmin && (
                  <div className="bg-white p-6 rounded-xl shadow-md border border-orange-200 mb-6">
                    <h3 className="font-bold text-orange-800 mb-3">發布新公告</h3>
                    <textarea value={bulletinText} onChange={e => setBulletinText(e.target.value)} className="w-full border p-3 rounded-lg mb-3 focus:ring-2 focus:ring-orange-500 outline-none" rows={3} placeholder="輸入公告內容..."></textarea>
                    <div className="flex justify-between items-center">
                       <input type="file" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" ref={fileInputRef} onChange={handleImageUpload} />
                       <button onClick={handlePostBulletin} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold transition shadow-sm">發布</button>
                    </div>
                  </div>
               )}
               {bulletins.map(b=><div key={b.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative mb-4">{isAdmin && <button onClick={() => handleDeleteBulletin(b.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition">🗑️</button>} <p className="whitespace-pre-wrap text-lg text-gray-800">{b.content}</p>{b.image_url && <img src={b.image_url} className="mt-4 rounded-lg max-w-full border" />}</div>)}
           </div>}

           {activeTab === 'form' && (
             <div className="bg-white p-8 rounded-xl shadow-md border border-amber-200">
               <h3 className="text-xl font-bold text-amber-900 mb-6 border-b pb-2">填寫報名表</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">1. 大隊 <span className="text-red-500">*</span></label>
                  <select className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-amber-500 outline-none" value={formData.team_big} onChange={e=>setFormData({...formData, team_big:e.target.value})}>
                      <option value="">請選擇...</option>
                      {teamBigOptions.map(o=><option key={o.id} value={o.value}>{o.value}</option>)}
                  </select>
                  </div>
                  <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">2. 小隊 <span className="text-red-500">*</span></label>
                  <select className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-amber-500 outline-none" value={formData.team_small} onChange={e=>setFormData({...formData, team_small:e.target.value})}>
                      <option value="">請選擇...</option>
                      {teamSmallOptions.map(o=><option key={o.id} value={o.value}>{o.value}</option>)}
                  </select>
                  </div>
                  <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">3. 精舍 <span className="text-red-500">* (限2字)</span></label><input className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={formData.monastery} onChange={e=>setFormData({...formData, monastery:e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">4. 姓名 <span className="text-red-500">*</span></label><input className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={formData.real_name} onChange={e=>setFormData({...formData, real_name:e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">5. 法名</label><input className="border p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={formData.dharma_name} onChange={e=>setFormData({...formData, dharma_name:e.target.value})} /></div>
                  <div className="flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">6. 新增異動 <span className="text-red-500">*</span></label><select className="border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-amber-500 outline-none" value={formData.action_type} onChange={e=>setFormData({...formData, action_type:e.target.value})}><option value="新增">新增</option><option value="異動">異動</option></select></div>
                  <div className="lg:col-span-2 flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">7. 發心起日/時 <span className="text-red-500">*</span></label><div className="flex gap-2"><input type="date" className="border p-3 rounded-lg flex-1 focus:ring-2 focus:ring-amber-500 outline-none" value={formData.start_date} onChange={e=>setFormData({...formData, start_date:e.target.value})} /><input type="time" className="border p-3 rounded-lg flex-1 focus:ring-2 focus:ring-amber-500 outline-none" value={formData.start_time} onChange={e=>setFormData({...formData, start_time:e.target.value})} /></div></div>
                  <div className="lg:col-span-2 flex flex-col gap-1"><label className="text-sm font-medium text-gray-700">8. 發心迄日/時 <span className="text-red-500">*</span></label><div className="flex gap-2"><input type="date" className="border p-3 rounded-lg flex-1 focus:ring-2 focus:ring-amber-500 outline-none" value={formData.end_date} onChange={e=>setFormData({...formData, end_date:e.target.value})} /><input type="time" className="border p-3 rounded-lg flex-1 focus:ring-2 focus:ring-amber-500 outline-none" value={formData.end_time} onChange={e=>setFormData({...formData, end_time:e.target.value})} /></div></div>
                  <div className="md:col-span-4 mt-2"><label className="flex items-center gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50 transition"><input type="checkbox" className="w-5 h-5 text-amber-600 rounded" checked={formData.need_help} onChange={e=>setFormData({...formData, need_help:e.target.checked})} /> <span className="text-gray-700 font-medium">9. 是否需要協助報名 (是)</span></label></div>
                  <div className="md:col-span-4"><textarea className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" rows={3} placeholder="10. 備註 (選填)" value={formData.memo} onChange={e=>setFormData({...formData, memo:e.target.value})}></textarea></div>
               </div>
               <button onClick={handleSubmit} className="w-full bg-amber-700 hover:bg-amber-800 text-white py-4 rounded-lg font-bold text-lg shadow-md mt-8 transition">送出報名表</button>
             </div>
           )}

           {activeTab === 'history' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {notes.filter(n => n.user_id === user.id).map(n => {
                   const isDone = isExpired(n.end_date, n.end_time);
                   return (
                   <div key={n.id} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden hover:shadow-md transition ${isDone ? 'bg-gray-50 grayscale opacity-80' : 'border-l-4 border-l-amber-500'}`}>
                      {n.is_deleted && <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10"><span className="bg-red-100 text-red-600 px-3 py-1 rounded-full font-bold border border-red-200">已刪除</span></div>}
                      {isDone && <span className="absolute top-0 right-0 bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-bl-lg z-0">🎉 已圓滿</span>}
                      
                      <div className="flex justify-between items-start mb-3">
                          <h4 className="text-lg font-bold text-gray-800">{n.team_big} <span className="text-sm font-normal text-gray-500 mx-1">/</span> {n.team_small}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${n.action_type==='新增'?'bg-blue-100 text-blue-700':'bg-orange-100 text-orange-700'}`}>{n.action_type}</span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex justify-between border-b border-dashed border-gray-200 pb-2">
                            <span>{n.real_name} {n.dharma_name ? `(${n.dharma_name})` : ''}</span>
                            <span>{n.monastery}</span>
                        </div>
                        <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 mt-2">
                            <span className="text-gray-400">起：</span><span>{n.start_date} {n.start_time}</span>
                            <span className="text-gray-400">迄：</span><span>{n.end_date} {n.end_time}</span>
                        </div>
                        {n.memo && <div className="bg-yellow-50 p-2 rounded text-xs text-gray-600 mt-2">{n.memo}</div>}
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                         <span className="text-xs text-gray-400">填表: {n.sign_name}</span>
                         <label className={`flex items-center gap-2 cursor-pointer text-sm ${isDone ? 'opacity-0 pointer-events-none' : 'hover:text-red-500'}`}>
                             <span className="text-gray-400">刪除</span>
                             <input type="checkbox" className="accent-red-500 w-4 h-4" checked={n.is_deleted} onChange={() => handleToggleDeleteNote(n.id, n.is_deleted)} disabled={isDone} />
                         </label>
                      </div>
                   </div>
                )})}
                {notes.filter(n => n.user_id === user.id).length === 0 && <div className="col-span-full text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed">尚無報名紀錄</div>}
             </div>
           )}
           
           {activeTab === 'admin_settings' && isAdmin && (
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div>
                    <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">大隊選項管理</h4>
                    <ul className="space-y-2 mb-4">
                        {teamBigOptions.map(o=><li key={o.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm"><span>{o.value}</span><button onClick={()=>handleDeleteOption(o.id)} className="text-red-400 hover:text-red-600">✕</button></li>)}
                    </ul>
                    <div className="flex gap-2"><input className="border p-2 rounded flex-1 text-sm outline-none focus:border-blue-500" placeholder="輸入大隊名稱..." value={selectedCategory==='team_big'?newOptionValue:''} onChange={e=>{setNewOptionValue(e.target.value);setSelectedCategory('team_big')}} /><button onClick={()=>handleAddOption('team_big')} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 text-sm">新增</button></div>
                 </div>
                 <div>
                    <h4 className="font-bold text-gray-700 mb-3 border-b pb-2">小隊選項管理</h4>
                    <ul className="space-y-2 mb-4">
                        {teamSmallOptions.map(o=><li key={o.id} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded text-sm"><span>{o.value}</span><button onClick={()=>handleDeleteOption(o.id)} className="text-red-400 hover:text-red-600">✕</button></li>)}
                    </ul>
                    <div className="flex gap-2"><input className="border p-2 rounded flex-1 text-sm outline-none focus:border-blue-500" placeholder="輸入小隊名稱..." value={selectedCategory==='team_small'?newOptionValue:''} onChange={e=>{setNewOptionValue(e.target.value);setSelectedCategory('team_small')}} /><button onClick={()=>handleAddOption('team_small')} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 text-sm">新增</button></div>
                 </div>
              </div>
           )}

           {activeTab === 'admin_data' && isAdmin && (
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 overflow-hidden">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-gray-700">全部報名資料列表</h3>
                    <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition flex items-center gap-2">📥 匯出 Excel</button>
                 </div>
                 <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500"><tr><th className="p-3 rounded-tl-lg">大隊</th><th className="p-3">姓名</th><th className="p-3">日期</th><th className="p-3 rounded-tr-lg">填表人</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                        {notes.map(n=>(
                        <tr key={n.id} className="hover:bg-gray-50 transition">
                            <td className="p-3 text-gray-900">{n.team_big}</td>
                            <td className="p-3 font-medium text-gray-900">{n.real_name}</td>
                            <td className="p-3 text-gray-500">{n.start_date}</td>
                            <td className="p-3 text-blue-600 text-xs">{n.sign_name}</td>
                        </tr>))}
                    </tbody>
                 </table>
                 </div>
              </div>
           )}

           {activeTab === 'admin_users' && isAdmin && (
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
                 <div className="mb-8 p-5 bg-blue-50 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">➕ 新增使用者 <span className="text-xs font-normal bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">自動產生 UID</span></h4>
                    <div className="flex flex-col md:flex-row gap-3">
                       <input placeholder="姓名" className="border border-blue-200 p-2 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-blue-400" value={addUserName} onChange={e=>setAddUserName(e.target.value)} />
                       <input placeholder="ID後4碼" className="border border-blue-200 p-2 rounded-lg w-full md:w-32 outline-none focus:ring-2 focus:ring-blue-400" value={addUserLast4} onChange={e=>setAddUserLast4(e.target.value)} />
                       <input placeholder="預設密碼" className="border border-blue-200 p-2 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-blue-400" value={addUserPwd} onChange={e=>setAddUserPwd(e.target.value)} />
                       <button onClick={handleAdminAddUser} className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm whitespace-nowrap">新增</button>
                    </div>
                 </div>
                 
                 <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-500">
                        <tr>
                            <th className="p-3 rounded-tl-lg">登入者姓名 (填表人)</th>
                            <th className="p-3">法名</th>
                            <th className="p-3">身份證ID後4碼</th>
                            <th className="p-3">修改密碼</th>
                            <th className="p-3">停用</th>
                            <th className="p-3 rounded-tr-lg text-right">報名筆數</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {allUsers.map(u=>(
                          <tr key={u.id} className="hover:bg-gray-50 transition">
                             <td className="p-3 font-medium text-gray-900">{u.display_name}</td>
                             <td className="p-3 text-gray-600">{u.dharma || '-'}</td>
                             <td className="p-3 text-gray-500">{u.id_last4}</td>
                             <td className="p-3">
                                <button onClick={() => { setPwdTargetUser(u); setShowPwdModal(true); }} className="text-blue-600 hover:text-blue-800 text-xs border border-blue-200 px-3 py-1.5 rounded-md bg-blue-50 hover:bg-blue-100 transition">重設</button>
                             </td>
                             <td className="p-3">
                                <button onClick={()=>handleToggleUserDisabled(u.email, u.is_disabled)} className={`px-3 py-1.5 rounded-md text-xs border transition ${u.is_disabled ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
                                    {u.is_disabled ? '啟用' : '停用'}
                                </button>
                             </td>
                             <td className="p-3 text-right font-bold text-blue-600">{u.count}</td>
                          </tr>
                       ))}
                       {allUsers.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">目前沒有使用者資料</td></tr>}
                    </tbody>
                 </table>
                 </div>
              </div>
           )}

           {showPwdModal && (
             <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-sm">
                   <h3 className="font-bold text-lg mb-4 text-gray-800">重設密碼</h3>
                   <p className="text-sm text-gray-500 mb-4">對象：<span className="font-bold text-gray-700">{pwdTargetUser?.display_name}</span></p>
                   <input type="password" placeholder="請輸入新密碼 (至少6碼)" className="w-full border p-3 mb-6 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                   <div className="flex justify-end gap-3">
                       <button onClick={() => setShowPwdModal(false)} className="px-5 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">取消</button>
                       <button onClick={handleChangePassword} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition shadow-sm">確認修改</button>
                   </div>
                </div>
             </div>
           )}

        </div>
      )}
    </div>
  );
}