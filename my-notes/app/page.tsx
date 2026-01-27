'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

// ==========================================
// [⚠️ 部署 Vercel 必讀]
// 1. 請確保有安裝: npm install @supabase/supabase-js
// 2. 解除下方 import 的註解。
// 3. 刪除下方 [預覽用替代定義] 的區塊。
// 4. [關鍵] 為了讓管理員能強制重設密碼，以及讓「忘記密碼」功能正常運作，
//    請在 Vercel 環境變數新增：
//    - NEXT_PUBLIC_SUPABASE_URL
//    - NEXT_PUBLIC_SUPABASE_ANON_KEY
//    - NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY (從 Supabase 後台 > Settings > API 取得)
// ==========================================

// [步驟 1] 部署到 Vercel 時，請解除下方這一行的註解
// import { createClient as _createSupabaseClient } from '@supabase/supabase-js';
import { createClient as _createSupabaseClient } from '@supabase/supabase-js';
// --- 設定控制開關 ---
// [步驟 2] 部署時，請將 true 改為 false
const useMock = false; 

// --- 全域變數宣告 ---
let mockUser: any = null;
let mockDb: any = {
  notes: [
      { id: 1, team_big: '觀音隊', team_small: '第1小隊', monastery: '台北', real_name: '王小明', dharma_name: '寬明', action_type: '新增', start_date: '2023-10-01', start_time: '08:00', end_date: '2023-10-01', end_time: '12:00', need_help: true, memo: '模擬資料', id_2: '1234', sign_name: '王小明 (1234)', is_deleted: false, created_at: new Date('2023-10-01T08:00:00').toISOString(), user_id: 'user-1' }
  ],
  bulletins: [{ id: 1, content: '🎉 歡迎使用一一報名系統！', image_url: '', created_at: new Date().toISOString() }],
  user_permissions: [
      { id: 1, email: 'admin@example.com', uid: 'user-1', is_admin: true, is_disabled: false, user_name: 'admin', id_last4: '1234', created_at: new Date().toISOString() },
      { id: 2, email: 'user@example.com', uid: 'user-2', is_admin: false, is_disabled: false, user_name: '王小明', id_last4: '5566', created_at: new Date().toISOString() }
  ],
  // [新增] 重設密碼申請資料表
  reset_requests: [
      { id: 101, user_name: '王小明', id_last4: '5566', uid: 'user-2', status: 'pending', created_at: new Date().toISOString() }
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

// --- 模擬客戶端邏輯 (請勿更動) ---
const createMockClient = (url: string, key: string, options?: any) => {
  return {
    auth: {
      getUser: async () => ({ data: { user: mockUser } }),
      signUp: async ({ email, password, options }: any) => {
        const newUid = Math.random().toString();
        const newUser = { id: newUid, email, user_metadata: options?.data };
        if (mockDb) {
           if(!mockDb.user_permissions) mockDb.user_permissions = [];
           mockDb.user_permissions.push({
               id: Date.now(),
               uid: newUid,
               email: email, 
               is_admin: false, 
               is_disabled: false, 
               user_name: options?.data?.display_name, 
               id_last4: options?.data?.id_last4,
               created_at: new Date().toISOString()
           });
        }
        return { data: { user: newUser }, error: null };
      },
      signInWithPassword: async ({ email, password }: any) => {
        if (mockDb && mockDb.user_permissions) {
             const perm = mockDb.user_permissions.find((p:any) => p.email === email);
             if (perm && perm.is_disabled) {
                 return { data: { user: null }, error: { message: '此帳號已被禁用，無法登入。' } };
             }
        }
        mockUser = { email, id: 'mock-id' };
        if(mockDb && mockDb.user_permissions) {
             const u = mockDb.user_permissions.find((p:any) => p.email === email);
             if(u) mockUser.id = u.uid;
        }
        return { data: { user: mockUser }, error: null };
      },
      updateUser: async () => ({ error: null }),
      admin: { 
          deleteUser: async () => ({ error: null }),
          updateUserById: async (uid: string, attributes: any) => {
             console.log(`[模擬] 強制修改用戶 ${uid} 密碼為 ${attributes.password}`);
             return { error: null };
          }
      }
    },
    from: (table: string) => ({
      select: (columns: string) => ({
        order: (col: string, { ascending }: any = {}) => {
            const data = mockDb ? (mockDb[table] || []) : [];
            // 簡單排序模擬
            const sorted = [...data].sort((a,b) => ascending ? (a[col]>b[col]?1:-1) : (a[col]<b[col]?1:-1));
            return { data: sorted, error: null };
        },
        eq: (col: string, val: any) => ({
             order: () => {
                 const data = mockDb ? (mockDb[table] || []) : [];
                 return { data: data.filter((item: any) => item[col] === val), error: null };
             },
             single: () => {
                 const data = mockDb ? (mockDb[table] || []) : [];
                 const found = data.find((item: any) => item[col] === val);
                 return { data: found, error: null };
             },
             maybeSingle: () => {
                 const data = mockDb ? (mockDb[table] || []) : [];
                 const found = data.find((item: any) => item[col] === val);
                 return { data: found, error: null };
             }
        })
      }),
      insert: async (data: any[]) => {
        if (mockDb) {
            if (!mockDb[table]) mockDb[table] = [];
            const items = Array.isArray(data) ? data : [data];
            items.forEach(item => {
                const newEntry = { ...item, id: Math.random(), created_at: new Date().toISOString() };
                mockDb[table].push(newEntry);
            });
        }
        return { error: null };
      },
      update: (updates: any) => ({
        eq: async (col: string, val: any) => {
           if (mockDb && mockDb[table]) {
             mockDb[table] = mockDb[table].map((item: any) => item[col] === val ? { ...item, ...updates } : item);
             return { error: null, data: [updates] };
           }
           return { error: null, data: [] };
        }
      }),
      delete: () => ({
        eq: async (col: string, val: any) => {
          if (mockDb && mockDb[table]) {
            mockDb[table] = mockDb[table].filter((item: any) => item[col] !== val);
          }
          return { error: null };
        }
      })
    }),
  } as any;
};

// --- 統一連線入口 ---
const createClient = (url: string, key: string, options?: any) => {
  // @ts-ignore
  if (!useMock && typeof _createSupabaseClient !== 'undefined') {
      // @ts-ignore
      return _createSupabaseClient(url, key, options);
  }
  return createMockClient(url, key, options);
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

  if (url && key && !useMock) {
    return createClient(url, key);
  }
  if (useMock) return createClient('mock', 'mock');
  return null; 
};

// --- Component ---
export default function RegistrationApp() {
  const [notes, setNotes] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const [user, setUser] = useState<any>(null);
  const [resetRequests, setResetRequests] = useState<any[]>([]); // [新增] 儲存申請列表
  
  const supabase = getSupabase(); 
  // 若 supabase 為 null，代表處於預覽模式，我們使用一個 local 的 mock client
  const client = useMemo(() => supabase || createClient('mock','mock'), [supabase]);

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
  
  // [修改] authMode 狀態: 'login', 'signup', 'forgot'
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // [修改] 新增 'admin_requests' 頁籤
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'admin_data' | 'admin_users' | 'admin_settings' | 'admin_requests' | 'bulletin'>('bulletin');
  const [filterMonth, setFilterMonth] = useState('');

  const [bulletinText, setBulletinText] = useState('');
  const [bulletinImage, setBulletinImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdTargetUser, setPwdTargetUser] = useState<any>(null);

  const [showApprovalModal, setShowApprovalModal] = useState(false); // [新增] 核准後顯示密碼的視窗
  const [approvedResult, setApprovedResult] = useState<any>(null);

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
  const isExpired = (d: string, t: string) => { if(!d) return false; return new Date(`${d}T${t||'23:59:59'}`) < new Date(); };

  useEffect(() => {
    const d = new Date(); 
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    setMinStartDate(dateStr);
  }, []);

  // === Actions (Functions) ===
  const handleLogout = useCallback(async () => {
    await client.auth.signOut();
    setUser(null); setNotes([]); setBulletins([]); setUsername(''); setIdLast4(''); setPassword('');
    setIsAdmin(false); setAuthMode('login'); setActiveTab('bulletin');
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

  const fetchBulletins = useCallback(async () => {
    if (!client) return;
    const { data } = await client.from('bulletins').select('*').order('created_at', { ascending: false });
    if(data) setBulletins(data);
    else if(!supabase && mockDb?.bulletins) setBulletins(mockDb.bulletins);
    else setBulletins([]);
  }, [client, supabase]);

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

  // [新增] 讀取重設申請列表
  const fetchResetRequests = useCallback(async () => {
    if (!client) return;
    const { data } = await client.from('reset_requests').select('*').order('created_at', { ascending: false });
    if (data) setResetRequests(data);
    else if (!supabase && mockDb?.reset_requests) setResetRequests(mockDb.reset_requests);
    else setResetRequests([]);
  }, [client, supabase]);

  const fetchNotes = useCallback(async () => {
      if(!client) return;
      const { data } = await client.from('notes').select('*').order('start_date', { ascending: true }).order('start_time', { ascending: true });
      if(data) setNotes(data);
      else if(!supabase && mockDb?.notes) setNotes(mockDb.notes);
      else setNotes([]);
  }, [client, supabase]);

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
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
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
        const result = data || [];
        if (error || result.length === 0) alert('更新失敗或無權限 (請檢查 RLS)');
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

  // [修改] 密碼修改與重設邏輯
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) return alert('至少6碼');
    if (useMock) return alert('預覽模式無法修改');
    
    setLoading(true);
    if (pwdTargetUser === 'SELF') {
      // 1. 修改自己
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) alert(error.message); else alert('成功');
    } else {
      // 2. 管理員重設他人
      // 需要使用 Service Role Key
      const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
      
      if (!serviceRoleKey) {
          alert('請先在 Vercel 設定 NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY 環境變數，才能啟用強制重設功能。');
          setLoading(false);
          return;
      }

      // 建立一個擁有超級權限的 client
      // @ts-ignore
      const adminClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          { auth: { persistSession: false } }
      );

      const { error } = await adminClient.auth.admin.updateUserById(
          pwdTargetUser.uid, 
          { password: newPassword }
      );

      if (error) alert('重設失敗: ' + error.message);
      else alert(`已強制重設 ${pwdTargetUser.display_name} 的密碼！`);
    }
    setLoading(false);
    setShowPwdModal(false);
  };

  // [新增] 處理密碼重設申請 (使用者端)
  const handleRequestReset = async () => {
    // [修正] 自動去除前後空白，避免手機輸入產生隱形空白導致找不到人
    const cleanName = username.trim();
    const cleanId = idLast4.trim();

    if (!cleanName || !cleanId) return alert('請輸入完整資訊');
    setLoading(true);

    try {
      console.log(`[重設申請] 正在搜尋用戶: 姓名=[${cleanName}], ID=[${cleanId}]`);
      
      // 1. 設定查詢用的 Client (必須是 Super Admin 才能繞過 RLS)
      let targetClient = client; // 預設使用普通權限 (如果是 Mock 模式)
      let targetUser = null;

      if (supabase) {
          // [修正] 必須使用 Service Role Key 來建立 Client，否則會被 RLS 擋住
          const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
          
          if (!serviceRoleKey) {
             alert('【系統設定錯誤】\n請在 Vercel 環境變數設定 NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY。\n否則系統無權限查詢用戶或建立申請單。');
             setLoading(false);
             return;
          }

          // @ts-ignore
          targetClient = createClient(
              process.env.NEXT_PUBLIC_SUPABASE_URL!,
              serviceRoleKey,
              { auth: { persistSession: false } }
          );

          // 使用超級權限查詢用戶
          const res = await targetClient.from('user_permissions').select('*').eq('user_name', cleanName).eq('id_last4', cleanId).maybeSingle();
          targetUser = res.data;

      } else if (mockDb && mockDb.user_permissions) {
        console.log('[Mock 模式] 目前模擬資料庫中的用戶:', mockDb.user_permissions);
        targetUser = mockDb.user_permissions.find((u:any) => u.user_name === cleanName && u.id_last4 === cleanId);
      }

      if (!targetUser) {
        console.warn('[重設申請] 找不到符合的用戶。請確認 user_permissions 資料表是否有該使用者的 user_name 與 id_last4');
        alert(`找不到此用戶 (${cleanName}, ${cleanId})。\n\n請確認姓名與ID後4碼完全相符 (包含空白)。`);
        setLoading(false);
        return;
      }

      // 2. 建立申請 (使用 targetClient 寫入，解決 "new row violates RLS" 錯誤)
      const newRequest = {
         user_name: cleanName,
         id_last4: cleanId,
         uid: targetUser.uid,
         status: 'pending',
      };

      if (supabase) {
         // [關鍵] 這裡使用 targetClient (Admin權限) 進行 Insert，就能無視 RLS
         const { error } = await targetClient.from('reset_requests').insert([newRequest]);
         if(error) throw error;
      } else {
         if(!mockDb.reset_requests) mockDb.reset_requests = [];
         mockDb.reset_requests.push({ ...newRequest, id: Date.now(), created_at: new Date().toISOString() });
      }

      alert('申請已送出！請通知管理員/主管進行審核。');
      setAuthMode('login'); // 回到登入頁
      setUsername(''); setIdLast4(''); setPassword('');

    } catch (e: any) {
      console.error(e);
      // 詳細錯誤處理
      if (e.message?.includes('violates row-level security')) {
          alert('【權限錯誤】\n即使使用了 Admin Key 仍然被拒絕，請檢查環境變數是否正確載入。\n或者請至 Supabase 設定 "reset_requests" 資料表的 Insert Policy。');
      } else {
          alert('申請失敗: ' + e.message);
      }
    }
    setLoading(false);
  };

  // [新增] 處理審核批准 (管理員端)
  const handleApproveReset = async (request: any) => {
    if (!confirm(`確定要批准 ${request.user_name} 的重設申請嗎？\n系統將生成一組隨機密碼。`)) return;
    
    // 產生 6 位數隨機密碼
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
    setLoading(true);

    try {
        // 1. 修改密碼 (Mock / Real)
        if (useMock) {
           console.log(`[模擬] 用戶 ${request.uid} 密碼已改為 ${tempPassword}`);
        } else {
           const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
           if (!serviceRoleKey) {
             alert('請設定 NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY 環境變數。');
             setLoading(false);
             return;
           }
           // @ts-ignore
           const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } });
           const { error } = await adminClient.auth.admin.updateUserById(request.uid, { password: tempPassword });
           if(error) throw error;
        }

        // 2. 更新申請狀態
        if (supabase) {
           await client.from('reset_requests').update({ status: 'completed' }).eq('id', request.id);
        } else {
           mockDb.reset_requests = mockDb.reset_requests.map((r:any) => r.id === request.id ? { ...r, status: 'completed' } : r);
        }

        // 3. 顯示結果
        setApprovedResult({ name: request.user_name, pwd: tempPassword });
        setShowApprovalModal(true);
        fetchResetRequests(); // 重新整理列表

    } catch(e: any) {
        alert('重設失敗: ' + e.message);
    }
    setLoading(false);
  };

  // [新增] 駁回申請
  const handleRejectReset = async (id: number) => {
      if(!confirm('確定駁回?')) return;
      if (supabase) {
          await client.from('reset_requests').update({ status: 'rejected' }).eq('id', id);
      } else {
          mockDb.reset_requests = mockDb.reset_requests.map((r:any) => r.id === id ? { ...r, status: 'rejected' } : r);
      }
      fetchResetRequests();
  };

  const handleAdminAddUser = async () => {
     if(!addUserName || !addUserLast4 || !addUserPwd) return alert('請輸入完整資料');
     const email = encodeName(addUserName+addUserLast4)+FAKE_DOMAIN;
     
     setLoading(true);

     if (supabase && process.env.NEXT_PUBLIC_SUPABASE_URL) {
         try {
             // @ts-ignore
             if (typeof createSupabaseClient !== 'function' || createSupabaseClient.toString().includes('return {}')) {
                alert('請在程式碼上方解除 createSupabaseClient 的註解並部署，才能使用此功能。');
                setLoading(false);
                return;
             }

             // @ts-ignore
             const tempClient = createSupabaseClient(
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
    if (useMock) { // Mock login
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
      if (useMock) return alert('預覽模式無法註冊');
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
          if (activeTab === 'admin_requests') fetchResetRequests(); // [新增]
      }
  }, [activeTab, isAdmin, fetchAllUsers, fetchOptions, fetchResetRequests]);

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

  if (!supabase && !useMock) {
      return <div className="p-10 text-center text-red-500 font-bold">⚠️ 系統未連接資料庫。請在 Vercel 設定環境變數。</div>;
  }

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center py-10 px-4 font-sans text-gray-900">
      <h1 className="text-3xl font-bold text-amber-900 mb-8 tracking-wide">一一報名系統 (v3.0)</h1>

      {!user ? (
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm border border-amber-200">
          <h2 className="text-xl font-bold mb-6 text-center text-gray-700">
            {authMode === 'login' ? '登入' : authMode === 'signup' ? '註冊' : '忘記密碼申請'}
          </h2>
          
          <div className="space-y-4">
            <input className="w-full p-3 border rounded" placeholder="姓名" value={username} onChange={e=>setUsername(e.target.value)} />
            <input className="w-full p-3 border rounded" placeholder="ID後四碼" maxLength={4} value={idLast4} onChange={e=>setIdLast4(e.target.value)} />
            
            {/* 只有登入和註冊需要密碼 */}
            {authMode !== 'forgot' && (
              <input className="w-full p-3 border rounded" type="password" placeholder="密碼" value={password} onChange={e=>setPassword(e.target.value)} />
            )}
          </div>

          <div className="mt-6 flex flex-col gap-2">
             {authMode === 'login' && <button onClick={handleLogin} className="w-full bg-amber-700 text-white py-3 rounded">登入</button>}
             {authMode === 'signup' && <button onClick={handleSignUp} className="w-full bg-amber-700 text-white py-3 rounded">註冊</button>}
             {authMode === 'forgot' && <button onClick={handleRequestReset} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded font-bold">送出重設申請</button>}
             
             <div className="flex justify-between text-sm mt-2">
               {authMode === 'login' ? (
                 <>
                   <button onClick={() => setAuthMode('signup')} className="text-gray-500 underline">沒有帳號？註冊</button>
                   <button onClick={() => setAuthMode('forgot')} className="text-blue-600 underline">忘記密碼？</button>
                 </>
               ) : (
                 <button onClick={() => setAuthMode('login')} className="text-gray-500 underline w-full text-center">返回登入</button>
               )}
             </div>
          </div>
          {authMode === 'forgot' && <p className="mt-4 text-xs text-center text-gray-400">送出後，請通知主管審核並取得新密碼</p>}
        </div>
      ) : (
        <div className="w-full max-w-6xl animate-fade-in">
           {/* Header */}
           <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-amber-100">
             <div className="flex items-center gap-3">
               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isAdmin ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                 {(getDisplayNameOnly(user.email||''))[0]}
               </div>
               <div>
                  <span className="font-bold">{getDisplayNameOnly(user.email||'')}</span>
                  <span className="text-xs text-gray-500 ml-2">ID: {getIdLast4FromEmail(user.email||'')}</span>
                  {isAdmin && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">管理員</span>}
               </div>
             </div>
             <div className="flex gap-2">
               <button onClick={() => { setPwdTargetUser('SELF'); setShowPwdModal(true); }} className="text-sm border px-3 py-1 rounded">修改密碼</button>
               <button onClick={handleLogout} className="text-sm text-red-500 border px-3 py-1 rounded">登出</button>
             </div>
           </div>
           
           {/* Tabs */}
           <div className="flex mb-6 bg-amber-100 p-1 rounded-lg w-full overflow-x-auto">
             {['bulletin','form','history'].map(t => (
                 <button key={t} onClick={()=>setActiveTab(t as any)} className={`flex-1 py-3 px-2 rounded-md ${activeTab===t?'bg-white shadow-sm text-black font-bold':'text-amber-600'}`}>{t==='bulletin'?'公告':t==='form'?'報名':'紀錄'}</button>
             ))}
             {isAdmin && ['admin_data','admin_users','admin_requests','admin_settings'].map(t => (
                 <button key={t} onClick={()=>setActiveTab(t as any)} className={`flex-1 py-3 px-2 rounded-md ${activeTab===t?'bg-white shadow-sm text-blue-800 font-bold':'text-blue-600'}`}>
                    {t==='admin_data'?'資料':t==='admin_users'?'用戶':t==='admin_requests'?'審核':'設定'}
                    {/* 紅點提示: 如果有 pending 的申請 (簡易模擬) */}
                    {t==='admin_requests' && resetRequests.some(r=>r.status==='pending') && <span className="ml-1 text-xs text-red-500">●</span>}
                 </button>
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
                  <div className="lg:col-span-2 flex flex-col gap-1"><label className="text-sm">7. 起日/時*</label><div className="flex gap-2"><input type="date" min={minStartDate} className="border p-2 rounded flex-1" value={formData.start_date} onChange={e=>setFormData({...formData, start_date:e.target.value})} /><input type="time" className="border p-2 rounded flex-1" value={formData.start_time} onChange={e=>setFormData({...formData, start_time:e.target.value})} /></div></div>
                  <div className="lg:col-span-2 flex flex-col gap-1"><label className="text-sm">8. 迄日/時*</label><div className="flex gap-2"><input type="date" min={formData.start_date} className="border p-2 rounded flex-1" value={formData.end_date} onChange={e=>setFormData({...formData, end_date:e.target.value})} /><input type="time" className="border p-2 rounded flex-1" value={formData.end_time} onChange={e=>setFormData({...formData, end_time:e.target.value})} /></div></div>
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
           
           {/* [新增] 密碼重設審核面板 */}
           {activeTab === 'admin_requests' && isAdmin && (
               <div className="bg-white p-6 rounded shadow">
                   <h3 className="font-bold mb-4">密碼重設申請</h3>
                   <div className="text-sm text-gray-500 mb-4 bg-yellow-50 p-2 rounded border border-yellow-200">
                       說明：點擊「批准」後，系統將產生一組隨機密碼並更新該用戶的登入密碼。請將新密碼口頭告知用戶。
                   </div>
                   
                   <table className="w-full text-sm text-left">
                       <thead className="bg-gray-50">
                           <tr>
                               <th className="p-2">申請人姓名</th>
                               <th className="p-2">ID後4碼</th>
                               <th className="p-2">申請時間</th>
                               <th className="p-2">狀態</th>
                               <th className="p-2">操作</th>
                           </tr>
                       </thead>
                       <tbody>
                           {resetRequests.map(r => (
                               <tr key={r.id} className="border-b">
                                   <td className="p-2 font-bold">{r.user_name}</td>
                                   <td className="p-2">{r.id_last4}</td>
                                   <td className="p-2 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                                   <td className="p-2">
                                       <span className={`px-2 py-0.5 rounded text-xs ${r.status==='pending'?'bg-orange-100 text-orange-800':r.status==='completed'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>
                                           {r.status === 'pending' ? '待審核' : r.status === 'completed' ? '已完成' : '已駁回'}
                                       </span>
                                   </td>
                                   <td className="p-2">
                                       {r.status === 'pending' && (
                                           <div className="flex gap-2">
                                               <button onClick={() => handleApproveReset(r)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700">批准重設</button>
                                               <button onClick={() => handleRejectReset(r.id)} className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300">駁回</button>
                                           </div>
                                       )}
                                   </td>
                               </tr>
                           ))}
                           {resetRequests.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">目前沒有申請</td></tr>}
                       </tbody>
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
                                <button onClick={() => { setPwdTargetUser(u); setShowPwdModal(true); }} className="text-blue-600 hover:text-blue-800 text-xs border border-blue-200 px-2 py-1 rounded bg-blue-50">
                                   重設
                                </button>
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
                   <h3 className="font-bold mb-4">
                      {pwdTargetUser === 'SELF' ? '修改我的密碼' : '重設使用者密碼'}
                   </h3>
                   
                   <p className="mb-4 text-sm text-gray-600">
                      對象：<strong>{pwdTargetUser?.display_name}</strong>
                      {pwdTargetUser !== 'SELF' && <br/>}
                      {pwdTargetUser !== 'SELF' && <span className="text-xs text-red-500">* 此操作將直接修改使用者的登入密碼</span>}
                   </p>

                   <input type="password" placeholder="請輸入新密碼 (至少6碼)" className="w-full border p-2 mb-4 rounded" value={newPassword} onChange={e => setNewPassword(e.target.value)} />

                   <div className="flex justify-end gap-2">
                       <button onClick={() => setShowPwdModal(false)} className="px-4 py-2 bg-gray-200 rounded">取消</button>
                       <button onClick={handleChangePassword} className="px-4 py-2 bg-blue-600 text-white rounded">
                           確認修改
                       </button>
                   </div>
                </div>
             </div>
           )}
           
           {/* [新增] 批准成功後顯示新密碼的視窗 */}
           {showApprovalModal && approvedResult && (
               <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
                   <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm border-2 border-green-500 text-center animate-bounce-in">
                       <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                           <span className="text-3xl">✅</span>
                       </div>
                       <h3 className="text-2xl font-bold text-gray-800 mb-2">重設成功！</h3>
                       <p className="text-gray-600 mb-4">
                           用戶 <strong>{approvedResult.name}</strong> 的密碼已更新。
                       </p>
                       <div className="bg-gray-100 p-4 rounded-lg border border-gray-300 mb-4">
                           <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">新臨時密碼</p>
                           <p className="text-3xl font-mono font-bold text-blue-600 tracking-widest select-all">{approvedResult.pwd}</p>
                       </div>
                       <p className="text-sm text-red-500 mb-6 font-medium">請立即告知用戶，並要求其登入後修改密碼。</p>
                       <button onClick={() => setShowApprovalModal(false)} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 transition">
                           我已告知用戶，關閉視窗
                       </button>
                   </div>
               </div>
           )}

        </div>
      )}
    </div>
  );
}