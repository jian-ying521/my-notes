'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { 
  Bell, 
  FileText, 
  History, 
  Settings, 
  Users, 
  Shield, 
  LogOut, 
  Plus, 
  Trash2, 
  Key, 
  Check, 
  X, 
  Calendar, 
  Edit, 
  User,
  Menu,
  ChevronRight,
  Download
} from 'lucide-react';

// ==========================================
// [⚠️ 部署 Vercel 必讀]
// 1. 請確保有安裝: npm install @supabase/supabase-js lucide-react
// 2. 解除下方 import 的註解。
// 3. 刪除下方 [預覽用替代定義] 的區塊。
// 4. [關鍵] Vercel 環境變數：
//    - NEXT_PUBLIC_SUPABASE_URL
//    - NEXT_PUBLIC_SUPABASE_ANON_KEY
//    - NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
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
      { id: 1, team_big: '觀音隊', team_small: '第1小隊', monastery: '台北', real_name: 'admin', dharma_name: '寬明', action_type: '新增', start_date: '2023-10-01', start_time: '08:00', end_date: '2023-10-01', end_time: '12:00', need_help: true, memo: '模擬資料', id_2: '1111', sign_name: 'admin (1111)', is_deleted: false, created_at: new Date('2023-10-01T08:00:00').toISOString(), user_id: 'user-1' },
      { id: 2, team_big: '普賢隊', team_small: '第2小隊', monastery: '台中', real_name: 'admin', dharma_name: '寬明', action_type: '異動', start_date: '2023-10-02', start_time: '14:00', end_date: '2023-10-04', end_time: '17:00', need_help: false, memo: '測試多日行程', id_2: '1111', sign_name: 'admin (1111)', is_deleted: false, created_at: new Date('2023-10-02T09:00:00').toISOString(), user_id: 'user-1' },
      { id: 101, team_big: '文殊隊', team_small: '第3小隊', monastery: '高雄', real_name: '王小明', dharma_name: '法明', action_type: '新增', start_date: '2025-02-15', start_time: '09:00', end_date: '2025-02-15', end_time: '17:00', need_help: false, memo: '我是王小明的第一筆紀錄', id_2: '5566', sign_name: '王小明 (5566)', is_deleted: false, created_at: new Date('2025-01-15T10:00:00').toISOString(), user_id: 'user-2' },
      // [新增] 模擬一筆已過期的資料，測試「已圓滿」功能
      { id: 102, team_big: '地藏隊', team_small: '第1小隊', monastery: '花蓮', real_name: '王小明', dharma_name: '法明', action_type: '異動', start_date: '2023-03-01', start_time: '08:30', end_date: '2023-03-03', end_time: '16:00', need_help: true, memo: '已結束的行程', id_2: '5566', sign_name: '王小明 (5566)', is_deleted: false, created_at: new Date('2023-01-20T14:30:00').toISOString(), user_id: 'user-2' }
  ],
  bulletins: [{ id: 1, content: '🎉 歡迎使用一一報名系統 (v3.5)！\n已在資料總表中加入「法名」欄位。', image_url: '', created_at: new Date().toISOString() }],
  user_permissions: [
      { id: 1, email: 'admin@example.com', uid: 'user-1', is_admin: true, is_disabled: false, user_name: 'admin', id_last4: '1111', created_at: new Date().toISOString() },
      { id: 2, email: 'user@example.com', uid: 'user-2', is_admin: false, is_disabled: false, user_name: '王小明', id_last4: '5566', created_at: new Date().toISOString() }
  ],
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

// --- 模擬客戶端邏輯 ---
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
      updateUser: async ({ password }: any) => {
          if (mockUser) {
             console.log(`[模擬] 用戶 ${mockUser.email} 修改密碼為: ${password}`);
             return { error: null };
          }
          return { error: { message: '未登入' } };
      },
      admin: { 
          deleteUser: async () => ({ error: null }),
          updateUserById: async (uid: string, attributes: any) => {
             console.log(`[模擬] 強制修改用戶 ${uid} 密碼為 ${attributes.password}`);
             return { error: null };
          }
      }
    },
    from: (table: string) => {
      const getStore = () => mockDb ? (mockDb[table] || []) : [];
      return {
        select: (columns: string) => {
            let filtered = [...getStore()];
            const builder = {
                order: (col: string, { ascending }: any = {}) => {
                    filtered.sort((a,b) => {
                        const valA = a[col] || '';
                        const valB = b[col] || '';
                        if (valA > valB) return ascending ? 1 : -1;
                        if (valA < valB) return ascending ? -1 : 1;
                        return 0;
                    });
                    return builder;
                },
                eq: (col: string, val: any) => {
                    filtered = filtered.filter((item: any) => item[col] === val);
                    return builder;
                },
                single: async () => ({ data: filtered[0] || null, error: null }),
                maybeSingle: async () => ({ data: filtered[0] || null, error: null }),
                then: (resolve: Function) => resolve({ data: filtered, error: null })
            };
            return builder;
        },
        insert: async (data: any[]) => {
            if (mockDb) {
                if (!mockDb[table]) mockDb[table] = [];
                const items = Array.isArray(data) ? data : [data];
                items.forEach(item => {
                    const newEntry = { ...item, id: Date.now() + Math.random(), created_at: new Date().toISOString() };
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
      };
    },
  } as any;
};

const createSupabaseInstance = () => {
  let url = '';
  let key = '';
  try {
    if (typeof process !== 'undefined' && process.env) {
      url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    }
  } catch (e) { }

  // @ts-ignore
  if (!useMock && url && key && typeof _createSupabaseClient !== 'undefined') {
      // @ts-ignore
      return _createSupabaseClient(url, key);
  }
  return createMockClient('mock', 'mock');
};

// --- Helper Functions ---
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

const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return '-';
    const d1 = new Date(start);
    const d2 = new Date(end);
    const diffTime = d2.getTime() - d1.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    return diffDays + 1;
};

export default function RegistrationApp() {
  const supabase = useMemo(() => createSupabaseInstance(), []);
  const client = supabase;

  const [notes, setNotes] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const [user, setUser] = useState<any>(null);
  const [resetRequests, setResetRequests] = useState<any[]>([]); 
  
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
  
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'admin_data' | 'admin_users' | 'admin_settings' | 'admin_requests' | 'bulletin'>('bulletin');
  const [filterMonth, setFilterMonth] = useState('');

  const [bulletinText, setBulletinText] = useState('');
  const [bulletinImage, setBulletinImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdTargetUser, setPwdTargetUser] = useState<any>(null);

  const [showApprovalModal, setShowApprovalModal] = useState(false); 
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

  useEffect(() => {
    const d = new Date(); 
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    setMinStartDate(dateStr);
  }, []);

  // Actions
  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null); setNotes([]); setBulletins([]); setUsername(''); setIdLast4(''); setPassword('');
    setIsAdmin(false); setAuthMode('login'); setActiveTab('bulletin');
  }, [supabase]);

  const checkUserStatus = useCallback(async (email: string) => {
      if (!email) return;
      try {
          if (useMock) {
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
  }, [supabase, handleLogout]);

  const fetchOptions = useCallback(async () => {
    try {
      const { data: bigDataRaw } = await supabase.from('system_options').select('*').eq('category', 'team_big').order('created_at', { ascending: true });
      const bigData = bigDataRaw || [];
      const finalBig = (useMock && bigData.length === 0 && mockDb?.system_options) ? 
                       mockDb.system_options.filter((o:any)=>o.category==='team_big') : bigData;
      setTeamBigOptions(finalBig);
      
      const { data: smallDataRaw } = await supabase.from('system_options').select('*').eq('category', 'team_small').order('created_at', { ascending: true });
      const smallData = smallDataRaw || [];
      const finalSmall = (useMock && smallData.length === 0 && mockDb?.system_options) ? 
                         mockDb.system_options.filter((o:any)=>o.category==='team_small') : smallData;
      setTeamSmallOptions(finalSmall);
    } catch (e) { console.error(e); }
  }, [supabase]);

  const fetchBulletins = useCallback(async () => {
    const { data } = await supabase.from('bulletins').select('*').order('created_at', { ascending: false });
    if(data) setBulletins(data);
    else if(useMock && mockDb?.bulletins) setBulletins(mockDb.bulletins);
    else setBulletins([]);
  }, [supabase]);

  const fetchAllUsers = useCallback(async () => {
    let pData: any[] = [];
    let nData: any[] = [];
    if (useMock) {
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
           return { ...u, display_name: userName, id_last4: userIdLast4, dharma: note?.dharma_name || '', count };
       }));
    }
  }, [supabase]);

  const fetchResetRequests = useCallback(async () => {
    let targetClient = supabase;
    if (!useMock) {
        const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
        if (serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL && typeof _createSupabaseClient !== 'undefined') {
            // @ts-ignore
            targetClient = _createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } });
        }
    }
    const { data, error } = await targetClient.from('reset_requests').select('*').order('created_at', { ascending: false });
    if (error) console.error("讀取申請列表失敗:", error);
    if (data) setResetRequests(data);
    else if (useMock && mockDb?.reset_requests) setResetRequests(mockDb.reset_requests);
    else setResetRequests([]);
  }, [supabase]);

  const fetchNotes = useCallback(async () => {
      const { data } = await supabase.from('notes').select('*').order('start_date', { ascending: true }).order('start_time', { ascending: true });
      if(data) setNotes(data);
      else if(useMock && mockDb?.notes) setNotes(mockDb.notes);
      else setNotes([]);
  }, [supabase]);

  const handleAddOption = async (category: string) => {
      if (!newOptionValue.trim()) return alert('請輸入名稱');
      setLoading(true);
      if (!useMock) {
          const { error } = await supabase.from('system_options').insert([{ category, value: newOptionValue.trim() }]);
          if (error) alert('新增失敗'); else { setNewOptionValue(''); fetchOptions(); }
      } else {
          mockDb.system_options.push({id: Date.now(), category, value: newOptionValue.trim()});
          setNewOptionValue(''); fetchOptions();
      }
      setLoading(false);
  };

  const handleDeleteOption = async (id: number) => {
      if(!confirm('刪除?')) return;
      if (!useMock) {
          const { error } = await supabase.from('system_options').delete().eq('id', id);
          if (error) alert('刪除失敗'); else fetchOptions();
      } else {
         mockDb.system_options = mockDb.system_options.filter((o:any)=>o.id!==id); 
         fetchOptions();
      }
  };

  const exportToExcel = () => {
    const data = filterMonth ? notes.filter(n => n.start_date.startsWith(filterMonth)) : notes;
    if (data.length === 0) return alert("無資料");
    // [修改] Excel 匯出欄位增加 發心起日/時、發心迄日/時、發心日數
    const csvContent = "\ufeff" + ["大隊,小隊,精舍,姓名,身分證後四碼,法名,動作,發心起日,發心起時,發心迄日,發心迄時,發心日數,協助,備註,登記時間,填表人,已刪除"].join(',') + '\n' + 
        data.map(n => {
            const days = calculateDuration(n.start_date, n.end_date);
            return `${n.team_big},${n.team_small},${n.monastery},${n.real_name},${n.id_2},${n.dharma_name},${n.action_type},${n.start_date},${n.start_time},${n.end_date},${n.end_time},${days},${n.need_help?'是':'否'},"${(n.memo||'').replace(/"/g,'""')}",${n.created_at},${n.sign_name},${n.is_deleted?'是':''}`;
        }).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = 'export.csv';
    link.click();
  };

  const handleToggleUserDisabled = async (email: string, status: boolean) => {
      if(!useMock) { 
        const { error } = await supabase.from('user_permissions').update({ is_disabled: !status }).eq('email', email);
        if(!error) fetchAllUsers();
        else alert('更新失敗: ' + error.message);
      } else {
         mockDb.user_permissions = mockDb.user_permissions.map((u:any)=>u.email===email ? {...u, is_disabled: !status} : u);
         fetchAllUsers();
      }
  };

  // [新增] 切換用戶管理員權限
  const handleToggleUserAdmin = async (email: string, currentStatus: boolean) => {
      // 安全檢查：不能取消自己的管理員權限
      if (user?.email === email && currentStatus === true) {
          return alert('為避免系統鎖死，您不能取消自己的管理員權限。');
      }

      if (!confirm(`確定要${currentStatus ? '取消' : '設定'}此用戶的管理員權限嗎？`)) return;

      if (!useMock) {
          const { error } = await supabase.from('user_permissions').update({ is_admin: !currentStatus }).eq('email', email);
          if (!error) fetchAllUsers();
          else alert('更新失敗: ' + error.message);
      } else {
          mockDb.user_permissions = mockDb.user_permissions.map((u: any) => u.email === email ? { ...u, is_admin: !currentStatus } : u);
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
    if (!useMock) {
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
    if (!useMock) {
        const { error } = await supabase.from('bulletins').delete().eq('id', id);
        if (!error) { alert('已刪除'); fetchBulletins(); }
    }
  };

  const handleToggleDeleteNote = async (id: number, currentStatus: boolean) => {
    if (!currentStatus && !confirm('確定刪除?')) return;
    setLoading(true);
    if (!useMock) {
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

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) return alert('至少6碼');
    setLoading(true);
    try {
        if (pwdTargetUser === 'SELF') {
          const { error } = await supabase.auth.updateUser({ password: newPassword });
          if (error) throw error;
          else { alert('修改成功！'); setShowPwdModal(false); }
        } else {
          // 管理員重設他人
          if (useMock) {
               console.log('[Mock] Admin reset password');
               alert(`已強制重設 ${pwdTargetUser.display_name} 的密碼！`);
               setShowPwdModal(false); setLoading(false); return;
          }
          const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
          if (!serviceRoleKey) {
              alert('請先在 Vercel 設定 NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY 環境變數。');
              setLoading(false); return;
          }
          // @ts-ignore
          const adminClient = _createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } });
          const { error } = await adminClient.auth.admin.updateUserById(pwdTargetUser.uid, { password: newPassword });
          if (error) alert('重設失敗: ' + error.message);
          else { alert(`已強制重設 ${pwdTargetUser.display_name} 的密碼！`); setShowPwdModal(false); }
        }
    } catch (e: any) {
        console.error("Change password error:", e);
        alert('執行失敗: ' + (e.message || '未知錯誤'));
    } finally { setLoading(false); }
  };

  const handleRequestReset = async () => {
    const cleanName = username.trim();
    const cleanId = idLast4.trim();
    if (!cleanName || !cleanId) return alert('請輸入完整資訊');
    setLoading(true);
    try {
      let targetClient = supabase;
      let targetUser = null;
      if (!useMock) {
          const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
          if (!serviceRoleKey) { alert('【系統設定錯誤】請設定 NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY。'); setLoading(false); return; }
          // @ts-ignore
          targetClient = _createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } });
          const res = await targetClient.from('user_permissions').select('*').eq('user_name', cleanName).eq('id_last4', cleanId).maybeSingle();
          targetUser = res.data;
      } else if (useMock && mockDb.user_permissions) {
        targetUser = mockDb.user_permissions.find((u:any) => u.user_name === cleanName && u.id_last4 === cleanId);
      }
      if (!targetUser) {
        alert(`找不到此用戶 (${cleanName}, ${cleanId})。\n\n請確認姓名與ID後4碼完全相符 (包含空白)。`);
        setLoading(false); return;
      }
      const newRequest = { user_name: cleanName, id_last4: cleanId, uid: targetUser.uid, status: 'pending' };
      if (!useMock) {
         const { error } = await targetClient.from('reset_requests').insert([newRequest]);
         if(error) throw error;
      } else {
         if(!mockDb.reset_requests) mockDb.reset_requests = [];
         mockDb.reset_requests.push({ ...newRequest, id: Date.now(), created_at: new Date().toISOString() });
      }
      alert('申請已送出！請通知管理員/主管進行審核。');
      setAuthMode('login'); setUsername(''); setIdLast4(''); setPassword('');
    } catch (e: any) {
      console.error(e);
      alert('申請失敗: ' + e.message);
    }
    setLoading(false);
  };

  const handleApproveReset = async (request: any) => {
    if (!confirm(`確定要批准 ${request.user_name} 的重設申請嗎？\n系統將生成一組隨機密碼。`)) return;
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
    setLoading(true);
    try {
        if (useMock) {
           console.log(`[模擬] 用戶 ${request.uid} 密碼已改為 ${tempPassword}`);
        } else {
           const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
           if (!serviceRoleKey) { alert('請設定 NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY 環境變數。'); setLoading(false); return; }
           // @ts-ignore
           const adminClient = _createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, { auth: { persistSession: false } });
           const { error } = await adminClient.auth.admin.updateUserById(request.uid, { password: tempPassword });
           if(error) throw error;
        }
        if (!useMock) { await supabase.from('reset_requests').update({ status: 'completed' }).eq('id', request.id); } 
        else { mockDb.reset_requests = mockDb.reset_requests.map((r:any) => r.id === request.id ? { ...r, status: 'completed' } : r); }
        setApprovedResult({ name: request.user_name, pwd: tempPassword });
        setShowApprovalModal(true); fetchResetRequests(); 
    } catch(e: any) { alert('重設失敗: ' + e.message); }
    setLoading(false);
  };

  const handleRejectReset = async (id: number) => {
      if(!confirm('確定駁回?')) return;
      if (!useMock) { await supabase.from('reset_requests').update({ status: 'rejected' }).eq('id', id); } 
      else { mockDb.reset_requests = mockDb.reset_requests.map((r:any) => r.id === id ? { ...r, status: 'rejected' } : r); }
      fetchResetRequests();
  };

  const handleAdminAddUser = async () => {
     if(!addUserName || !addUserLast4 || !addUserPwd) return alert('請輸入完整資料');
     const email = encodeName(addUserName+addUserLast4)+FAKE_DOMAIN;
     setLoading(true);
     if (!useMock && process.env.NEXT_PUBLIC_SUPABASE_URL) {
         try {
             if (typeof _createSupabaseClient !== 'function') { alert('請在程式碼上方解除 _createSupabaseClient 的註解並部署。'); setLoading(false); return; }
             // @ts-ignore
             const tempClient = _createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
             const { data, error } = await tempClient.auth.signUp({ email: email, password: addUserPwd, options: { data: { display_name: addUserName, id_last4: addUserLast4 } } });
             if (error) { alert('註冊失敗: ' + error.message); } 
             else { alert(`使用者 ${addUserName} 已建立！`); setAddUserName(''); setAddUserLast4(''); setAddUserPwd(''); fetchAllUsers(); }
         } catch(e:any) { alert('執行錯誤: ' + e.message); }
     } else {
         alert(`[模擬] 使用者 ${addUserName} 已建立`);
         if(useMock && mockDb) {
           if(!mockDb.user_permissions) mockDb.user_permissions = [];
           mockDb.user_permissions.push({ id: Date.now(), email, is_admin: false, is_disabled: false, user_name: addUserName, id_last4: addUserLast4, uid: 'mock-new-uid', created_at: new Date().toISOString() });
           fetchAllUsers();
         }
     }
     setLoading(false);
  };

  const handleSubmit = async () => {
    if(!user) return;
    if(formData.start_date < minStartDate) return alert('日期錯誤');
    const signName = `${getDisplayNameOnly(user.email||'')} (${getIdLast4FromEmail(user.email||'')})`;
    const payload = {...formData, user_id: user.id, id_2: getIdLast4FromEmail(user.email||''), sign_name: signName };
    if(!useMock) {
        const { error } = await supabase.from('notes').insert([payload]);
        if(!error) { alert('成功'); window.location.reload(); } else alert('失敗');
    } else if (useMock && mockDb) {
        if(!mockDb.notes) mockDb.notes = [];
        mockDb.notes.push({...payload, id: Date.now(), created_at: new Date().toISOString() });
        alert('[模擬] 報名成功'); fetchNotes(); setActiveTab('history');
    }
  };

  const handleLogin = async () => {
    const email = encodeName(username+idLast4) + FAKE_DOMAIN;
    
    // [修正] 統一使用 signInWithPassword，Mock Client 也有實作此方法且邏輯更完整 (會查對應 ID)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if(error) {
        alert('登入失敗');
    } else {
        setUser(data.user);
        setFormData(p => ({...p, real_name: username}));
        
        // [新增] 登入成功後立即讀取資料，不需要重新整理
        fetchNotes();
        fetchBulletins();
        fetchOptions();
        
        checkUserStatus(email);
    }
  };

  const handleSignUp = async () => {
      if (useMock) return alert('預覽模式無法註冊');
      const email = encodeName(username+idLast4) + FAKE_DOMAIN;
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: username, id_last4: idLast4 } } });
      if(error) alert(error.message); else { alert('註冊成功！'); window.location.reload(); }
  };

  useEffect(() => { 
      if (isAdmin) {
          if (activeTab === 'admin_users') fetchAllUsers();
          if (activeTab === 'admin_settings') fetchOptions();
          if (activeTab === 'admin_requests') fetchResetRequests(); 
      }
  }, [activeTab, isAdmin, fetchAllUsers, fetchOptions, fetchResetRequests]);

  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if(user) {
            const name = getDisplayNameOnly(user.email||'');
            setFormData(p => ({...p, real_name: name}));
            fetchNotes(); fetchBulletins(); fetchOptions(); checkUserStatus(user.email||'');
        }
    };
    init();
  }, [supabase, fetchNotes, fetchBulletins, fetchOptions, checkUserStatus]);

  // UI Components
  const openPwdModal = (target: any) => { setPwdTargetUser(target); setNewPassword(''); setShowPwdModal(true); };

  if (!useMock && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return <div className="p-10 text-center text-red-500 font-bold">⚠️ 系統未連接資料庫。請在 Vercel 設定環境變數。</div>;
  }

  // Icons mapping for tabs
  const TabButton = ({ id, label, icon: Icon, active, onClick, hasNotification }: any) => (
    <button 
      onClick={onClick}
      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-2 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-white shadow-md text-amber-700 font-bold border border-amber-100' 
          : 'text-amber-600 hover:bg-amber-100 hover:text-amber-800'
      }`}
    >
      <Icon className={`w-4 h-4 ${active ? 'stroke-2' : 'stroke-[1.5]'}`} />
      <span className="text-sm md:text-base">{label}</span>
      {hasNotification && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-1" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col items-center py-10 px-4 font-sans text-gray-900">
      <h1 className="text-3xl font-extrabold text-amber-900 mb-8 tracking-wide flex items-center gap-3">
        <Shield className="w-8 h-8 text-amber-600" />
        一一報名系統 (v3.5)
      </h1>

      {!user ? (
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm border border-amber-100">
          <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
                <User className="w-8 h-8" />
             </div>
          </div>
          <h2 className="text-xl font-bold mb-6 text-center text-gray-700">
            {authMode === 'login' ? '會員登入' : authMode === 'signup' ? '註冊帳號' : '忘記密碼'}
          </h2>
          
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="姓名" value={username} onChange={e=>setUsername(e.target.value)} />
            </div>
            <div className="relative">
              <Shield className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="ID後四碼" maxLength={4} value={idLast4} onChange={e=>setIdLast4(e.target.value)} />
            </div>
            
            {authMode !== 'forgot' && (
              <div className="relative">
                <Key className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input className="w-full pl-10 p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" type="password" placeholder="密碼" value={password} onChange={e=>setPassword(e.target.value)} />
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3">
             {authMode === 'login' && <button onClick={handleLogin} className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-lg font-bold shadow-md transition-all">登入</button>}
             {authMode === 'signup' && <button onClick={handleSignUp} className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-white py-3 rounded-lg font-bold shadow-md">註冊</button>}
             {authMode === 'forgot' && <button onClick={handleRequestReset} className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold shadow-md">送出申請</button>}
             
             <div className="flex justify-between text-sm mt-2 px-1">
               {authMode === 'login' ? (
                 <>
                   <button onClick={() => setAuthMode('signup')} className="text-gray-500 hover:text-amber-600 transition">沒有帳號？註冊</button>
                   <button onClick={() => setAuthMode('forgot')} className="text-amber-600 hover:underline">忘記密碼？</button>
                 </>
               ) : (
                 <button onClick={() => setAuthMode('login')} className="text-gray-500 hover:text-amber-600 w-full text-center">返回登入</button>
               )}
             </div>
          </div>
          {authMode === 'forgot' && <p className="mt-4 text-xs text-center text-gray-400 bg-gray-50 p-2 rounded">送出後，請通知主管審核並取得新密碼</p>}
        </div>
      ) : (
        <div className="w-full max-w-6xl animate-fade-in">
           {/* Header */}
           <div className="flex flex-col sm:flex-row justify-between items-center mb-6 bg-white p-4 rounded-2xl shadow-sm border border-amber-100 gap-4">
             <div className="flex items-center gap-4">
               <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner ${isAdmin ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                 {(getDisplayNameOnly(user.email||''))[0]}
               </div>
               <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-gray-800">{getDisplayNameOnly(user.email||'')}</span>
                    {isAdmin && <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold border border-red-200">管理員</span>}
                  </div>
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">ID: {getIdLast4FromEmail(user.email||'')}</span>
               </div>
             </div>
             <div className="flex gap-3">
               <button onClick={() => { setPwdTargetUser('SELF'); setShowPwdModal(true); }} className="flex items-center gap-1 text-sm bg-white border border-gray-200 hover:border-amber-300 hover:bg-amber-50 text-gray-600 px-4 py-2 rounded-lg transition-colors">
                 <Key className="w-4 h-4" /> 修改密碼
               </button>
               <button onClick={handleLogout} className="flex items-center gap-1 text-sm bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-4 py-2 rounded-lg transition-colors">
                 <LogOut className="w-4 h-4" /> 登出
               </button>
             </div>
           </div>
           
           {/* Tabs */}
           <div className="flex flex-wrap gap-2 mb-6 bg-amber-200/50 p-1.5 rounded-xl w-full">
             <TabButton id="bulletin" label="公告" icon={Bell} active={activeTab === 'bulletin'} onClick={() => setActiveTab('bulletin')} />
             <TabButton id="form" label="報名" icon={Edit} active={activeTab === 'form'} onClick={() => setActiveTab('form')} />
             <TabButton id="history" label="紀錄" icon={History} active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
             
             {isAdmin && (
               <>
                 <div className="w-px bg-amber-300 mx-1 hidden md:block"></div>
                 <TabButton id="admin_data" label="資料" icon={FileText} active={activeTab === 'admin_data'} onClick={() => setActiveTab('admin_data')} />
                 <TabButton id="admin_users" label="用戶" icon={Users} active={activeTab === 'admin_users'} onClick={() => setActiveTab('admin_users')} />
                 <TabButton id="admin_requests" label="審核" icon={Shield} active={activeTab === 'admin_requests'} onClick={() => setActiveTab('admin_requests')} hasNotification={resetRequests.some(r=>r.status==='pending')} />
                 <TabButton id="admin_settings" label="設定" icon={Settings} active={activeTab === 'admin_settings'} onClick={() => setActiveTab('admin_settings')} />
               </>
             )}
           </div>

           {/* Panels */}
           {activeTab === 'bulletin' && <div className="space-y-6">
               {isAdmin && (
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 mb-6">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> 發布新公告</h3>
                    <textarea value={bulletinText} onChange={e => setBulletinText(e.target.value)} className="w-full border border-gray-200 p-4 rounded-xl mb-4 focus:ring-2 focus:ring-orange-200 outline-none" placeholder="輸入公告內容..."></textarea>
                    <div className="flex justify-between items-center">
                       <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                       <button onClick={handlePostBulletin} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-colors flex items-center gap-2">
                         發布
                       </button>
                    </div>
                  </div>
               )}
               {bulletins.map(b=>(
                 <div key={b.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group hover:shadow-md transition-shadow">
                   {isAdmin && <button onClick={() => handleDeleteBulletin(b.id)} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>}
                   <div className="flex items-start gap-4">
                     <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center flex-shrink-0 text-amber-500">
                       <Bell className="w-5 h-5" />
                     </div>
                     <div className="flex-1">
                        <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{b.content}</p>
                        {b.image_url && <img src={b.image_url} alt="bulletin" className="mt-4 rounded-xl max-h-60 object-cover" />}
                        <p className="text-xs text-gray-400 mt-4">{new Date(b.created_at).toLocaleString()}</p>
                     </div>
                   </div>
                 </div>
               ))}
           </div>}

           {activeTab === 'form' && (
             <div className="bg-white p-8 rounded-2xl shadow-sm border border-amber-100">
               <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2 border-b pb-4">
                 <Edit className="w-6 h-6 text-amber-600" /> 填寫報名表
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-600">1. 大隊*</label>
                    <div className="relative">
                      <select className="w-full border border-gray-300 p-2.5 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-amber-500 outline-none" value={formData.team_big} onChange={e=>setFormData({...formData, team_big:e.target.value})}>
                          <option value="">請選擇...</option>
                          {teamBigOptions.map(o=><option key={o.id} value={o.value}>{o.value}</option>)}
                      </select>
                      <ChevronRight className="w-4 h-4 absolute right-3 top-3 text-gray-400 rotate-90 pointer-events-none" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-bold text-gray-600">2. 小隊*</label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 p-2.5 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-amber-500 outline-none" value={formData.team_small} onChange={e=>setFormData({...formData, team_small:e.target.value})}>
                        <option value="">請選擇...</option>
                        {teamSmallOptions.map(o=><option key={o.id} value={o.value}>{o.value}</option>)}
                    </select>
                    <ChevronRight className="w-4 h-4 absolute right-3 top-3 text-gray-400 rotate-90 pointer-events-none" />
                  </div>
                  </div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-bold text-gray-600">3. 精舍* (限2字)</label><input className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={formData.monastery} onChange={e=>setFormData({...formData, monastery:e.target.value})} /></div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-bold text-gray-600">4. 姓名*</label><input className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={formData.real_name} onChange={e=>setFormData({...formData, real_name:e.target.value})} /></div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-bold text-gray-600">5. 法名</label><input className="border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" value={formData.dharma_name} onChange={e=>setFormData({...formData, dharma_name:e.target.value})} /></div>
                  <div className="flex flex-col gap-2"><label className="text-sm font-bold text-gray-600">6. 新增異動*</label>
                  <div className="relative">
                    <select className="w-full border border-gray-300 p-2.5 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-amber-500 outline-none" value={formData.action_type} onChange={e=>setFormData({...formData, action_type:e.target.value})}><option value="新增">新增</option><option value="異動">異動</option></select>
                    <ChevronRight className="w-4 h-4 absolute right-3 top-3 text-gray-400 rotate-90 pointer-events-none" />
                  </div>
                  </div>
                  <div className="lg:col-span-2 flex flex-col gap-2"><label className="text-sm font-bold text-gray-600">7. 起日/時*</label><div className="flex gap-2"><input type="date" min={minStartDate} className="border border-gray-300 p-2.5 rounded-lg flex-1" value={formData.start_date} onChange={e=>setFormData({...formData, start_date:e.target.value})} /><input type="time" className="border border-gray-300 p-2.5 rounded-lg flex-1" value={formData.start_time} onChange={e=>setFormData({...formData, start_time:e.target.value})} /></div></div>
                  <div className="lg:col-span-2 flex flex-col gap-2"><label className="text-sm font-bold text-gray-600">8. 迄日/時*</label><div className="flex gap-2"><input type="date" min={formData.start_date} className="border border-gray-300 p-2.5 rounded-lg flex-1" value={formData.end_date} onChange={e=>setFormData({...formData, end_date:e.target.value})} /><input type="time" className="border border-gray-300 p-2.5 rounded-lg flex-1" value={formData.end_time} onChange={e=>setFormData({...formData, end_time:e.target.value})} /></div></div>
                  <div className="md:col-span-4 bg-gray-50 p-3 rounded-lg"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500" checked={formData.need_help} onChange={e=>setFormData({...formData, need_help:e.target.checked})} /> <span className="font-bold text-gray-700">9. 需協助報名 (是)</span></label></div>
                  <div className="md:col-span-4"><textarea className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none" placeholder="10. 備註 (選填)" value={formData.memo} onChange={e=>setFormData({...formData, memo:e.target.value})}></textarea></div>
               </div>
               <button onClick={handleSubmit} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-xl mt-8 font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                 <Check className="w-6 h-6" /> 送出報名
               </button>
             </div>
           )}

           {activeTab === 'history' && (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {notes.filter(n => n.user_id === user.id).map(n => {
                   // [新增] 判斷是否已過期 (小於今日)
                   const today = new Date();
                   today.setHours(0,0,0,0);
                   const endDate = new Date(n.end_date);
                   const isCompleted = endDate < today;

                   return (
                     <div key={n.id} className={`bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative ${n.is_deleted ? 'opacity-50 grayscale' : isCompleted ? 'opacity-70 bg-gray-50' : ''}`}>
                        <div className={`absolute top-4 right-4 px-2 py-1 rounded text-xs font-bold ${
                            n.is_deleted ? 'bg-red-100 text-red-700' : 
                            isCompleted ? 'bg-gray-200 text-gray-600' : // 已圓滿樣式
                            n.action_type === '新增' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {n.is_deleted ? '已刪除' : isCompleted ? '已圓滿' : n.action_type}
                        </div>
                        <div className="mb-3">
                          <h4 className="font-bold text-lg text-gray-800">{n.team_big}</h4>
                          <span className="text-sm text-gray-500 font-medium">{n.team_small}</span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-xl mb-3">
                          <div className="flex items-center gap-2"><User className="w-4 h-4 text-gray-400"/> {n.real_name} {n.dharma_name ? `(${n.dharma_name})` : ''}</div>
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400"/> 起: {n.start_date} {n.start_time}</div>
                          <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400"/> 迄: {n.end_date} {n.end_time}</div>
                        </div>

                        <div className="flex justify-end items-center pt-2 border-t border-gray-100 mt-2">
                           {/* [確認移除] 這裡已經沒有填表人欄位，只剩刪除按鈕 */}
                           <label className="flex items-center gap-1 cursor-pointer text-xs font-bold text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors">
                             <input type="checkbox" className="accent-red-500" checked={n.is_deleted} onChange={() => handleToggleDeleteNote(n.id, n.is_deleted)} /> 
                             刪除
                           </label>
                        </div>
                     </div>
                   );
                })}
                {notes.filter(n => n.user_id === user.id).length === 0 && (
                  <div className="col-span-full py-10 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    目前沒有報名紀錄
                  </div>
                )}
             </div>
           )}
           
           {activeTab === 'admin_settings' && isAdmin && (
              <div className="bg-white p-8 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div>
                    <h4 className="font-bold mb-4 text-gray-700 flex items-center gap-2"><Menu className="w-5 h-5" /> 大隊選項設定</h4>
                    <ul className="space-y-2 mb-4">
                      {teamBigOptions.map(o=>(
                        <li key={o.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 group">
                          <span className="font-medium">{o.value}</span>
                          <button onClick={()=>handleDeleteOption(o.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <input className="border p-2 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="新增選項..." value={selectedCategory==='team_big'?newOptionValue:''} onChange={e=>{setNewOptionValue(e.target.value);setSelectedCategory('team_big')}} />
                      <button onClick={()=>handleAddOption('team_big')} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5"/></button>
                    </div>
                 </div>
                 <div>
                    <h4 className="font-bold mb-4 text-gray-700 flex items-center gap-2"><Menu className="w-5 h-5" /> 小隊選項設定</h4>
                    <ul className="space-y-2 mb-4">
                      {teamSmallOptions.map(o=>(
                        <li key={o.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100 group">
                          <span className="font-medium">{o.value}</span>
                          <button onClick={()=>handleDeleteOption(o.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4"/></button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                      <input className="border p-2 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="新增選項..." value={selectedCategory==='team_small'?newOptionValue:''} onChange={e=>{setNewOptionValue(e.target.value);setSelectedCategory('team_small')}} />
                      <button onClick={()=>handleAddOption('team_small')} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5"/></button>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'admin_data' && isAdmin && (
              <div className="bg-white p-6 rounded-2xl shadow-sm overflow-hidden">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-gray-700 text-lg flex items-center gap-2"><FileText className="w-5 h-5"/> 資料總表</h3>
                   <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors">
                     <Download className="w-4 h-4"/> 匯出 Excel
                   </button>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600">
                        <tr>
                          <th className="p-3 rounded-l-lg">大隊</th>
                          <th className="p-3">小隊</th> {/* [新增] 小隊欄位 */}
                          <th className="p-3">姓名</th>
                          <th className="p-3">法名</th> {/* [新增] 法名欄位 */}
                          <th className="p-3">發心起日/時</th>
                          <th className="p-3">發心迄日/時</th>
                          <th className="p-3">發心日數</th>
                          <th className="p-3 rounded-r-lg">填表人</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {notes.map(n=>(
                          <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-3 font-medium text-gray-800">{n.team_big}</td>
                            <td className="p-3 text-gray-600">{n.team_small}</td> {/* [新增] 顯示小隊資料 */}
                            <td className="p-3">{n.real_name}</td>
                            <td className="p-3 text-gray-600">{n.dharma_name || '-'}</td> {/* [新增] 顯示法名 */}
                            
                            <td className="p-3 text-gray-600">
                              <div className="font-medium">{n.start_date}</div>
                              <div className="text-xs text-gray-400">{n.start_time}</div>
                            </td>
                            
                            <td className="p-3 text-gray-600">
                              <div className="font-medium">{n.end_date}</div>
                              <div className="text-xs text-gray-400">{n.end_time}</div>
                            </td>
                            
                            <td className="p-3 text-center">
                              <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded font-bold text-xs">
                                {calculateDuration(n.start_date, n.end_date)} 天
                              </span>
                            </td>

                            <td className="p-3 text-blue-500 font-mono text-xs">{n.sign_name}</td>
                          </tr>
                        ))}
                      </tbody>
                   </table>
                 </div>
              </div>
           )}
           
           {activeTab === 'admin_requests' && isAdmin && (
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
                   <h3 className="font-bold text-blue-800 mb-4 flex items-center gap-2 text-lg">
                     <Shield className="w-6 h-6" /> 密碼重設審核
                   </h3>
                   <div className="text-sm text-blue-700 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                       <div className="bg-blue-200 text-blue-700 rounded-full p-1 mt-0.5"><Check className="w-3 h-3"/></div>
                       說明：點擊「批准」後，系統將產生一組隨機密碼並更新該用戶的登入密碼。請將新密碼口頭告知用戶。
                   </div>
                   
                   <table className="w-full text-sm text-left">
                       <thead className="bg-gray-50 text-gray-600">
                           <tr>
                               <th className="p-3 rounded-l-lg">申請人</th>
                               <th className="p-3">ID後4碼</th>
                               <th className="p-3">時間</th>
                               <th className="p-3">狀態</th>
                               <th className="p-3 rounded-r-lg">操作</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                           {resetRequests.map(r => (
                               <tr key={r.id} className="hover:bg-gray-50">
                                   <td className="p-3 font-bold text-gray-800">{r.user_name}</td>
                                   <td className="p-3 font-mono text-gray-500">{r.id_last4}</td>
                                   <td className="p-3 text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</td>
                                   <td className="p-3">
                                       <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                         r.status==='pending' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                                         r.status==='completed' ? 'bg-green-100 text-green-700 border-green-200' : 
                                         'bg-red-100 text-red-700 border-red-200'
                                       }`}>
                                           {r.status === 'pending' ? '待審核' : r.status === 'completed' ? '已完成' : '已駁回'}
                                       </span>
                                   </td>
                                   <td className="p-3">
                                       {r.status === 'pending' && (
                                           <div className="flex gap-2">
                                               <button onClick={() => handleApproveReset(r)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-blue-700 flex items-center gap-1 shadow-sm font-bold">
                                                 <Check className="w-3 h-3" /> 批准
                                               </button>
                                               <button onClick={() => handleRejectReset(r.id)} className="bg-white text-gray-500 border border-gray-300 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-50 flex items-center gap-1 font-bold">
                                                 <X className="w-3 h-3" /> 駁回
                                               </button>
                                           </div>
                                       )}
                                   </td>
                               </tr>
                           ))}
                           {resetRequests.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">目前沒有待審核的申請</td></tr>}
                       </tbody>
                   </table>
               </div>
           )}

           {activeTab === 'admin_users' && isAdmin && (
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                 <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><Plus className="w-5 h-5"/> 新增使用者 (自動產生UID)</h4>
                    <div className="flex flex-col md:flex-row gap-3">
                       <input placeholder="姓名" className="border p-2.5 rounded-lg flex-1 outline-none focus:ring-2 focus:ring-blue-500" value={addUserName} onChange={e=>setAddUserName(e.target.value)} />
                       <input placeholder="ID後4碼" className="border p-2.5 rounded-lg w-full md:w-32 outline-none focus:ring-2 focus:ring-blue-500" value={addUserLast4} onChange={e=>setAddUserLast4(e.target.value)} />
                       <input placeholder="密碼" className="border p-2.5 rounded-lg w-full md:w-40 outline-none focus:ring-2 focus:ring-blue-500" value={addUserPwd} onChange={e=>setAddUserPwd(e.target.value)} />
                       <button onClick={handleAdminAddUser} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-blue-700 shadow-md">新增</button>
                    </div>
                 </div>
                 
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-600">
                          <tr>
                              <th className="p-3 rounded-l-lg">姓名</th>
                              <th className="p-3">法名</th>
                              <th className="p-3">身份證ID</th>
                              <th className="p-3">管理員</th>
                              <th className="p-3">狀態</th>
                              <th className="p-3 text-right rounded-r-lg">報名數</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                         {allUsers.map(u=>(
                            <tr key={u.id} className="hover:bg-gray-50">
                               <td className="p-3 font-bold text-gray-800">{u.display_name}</td>
                               <td className="p-3 text-gray-500">{u.dharma || '-'}</td>
                               <td className="p-3 font-mono text-gray-500">{u.id_last4}</td>
                               <td className="p-3">
                                  <label className="flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        checked={u.is_admin || false} 
                                        onChange={() => handleToggleUserAdmin(u.email, u.is_admin)}
                                    />
                                    <span className="ml-2 text-xs text-gray-500 select-none">{u.is_admin ? '是' : '否'}</span>
                                  </label>
                               </td>
                               <td className="p-3">
                                  <button onClick={()=>handleToggleUserDisabled(u.email, u.is_disabled)} className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${u.is_disabled ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100'}`}>
                                      {u.is_disabled ? '已停用' : '啟用中'}
                                  </button>
                               </td>
                               <td className="p-3 text-right font-bold text-blue-600">{u.count}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                 </div>
              </div>
           )}

           {showPwdModal && (
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm relative">
                   <button onClick={() => setShowPwdModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
                   <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600 mx-auto">
                     <Key className="w-6 h-6" />
                   </div>
                   <h3 className="font-bold text-xl text-center text-gray-800 mb-2">
                      {pwdTargetUser === 'SELF' ? '修改我的密碼' : '重設使用者密碼'}
                   </h3>
                   
                   <p className="mb-6 text-sm text-gray-500 text-center">
                      對象：<strong className="text-gray-800">{pwdTargetUser?.display_name}</strong>
                      {pwdTargetUser !== 'SELF' && <br/>}
                      {pwdTargetUser !== 'SELF' && <span className="text-xs text-red-500 block mt-1 bg-red-50 p-1 rounded">* 此操作將強制覆蓋現有密碼</span>}
                   </p>

                   <input type="password" placeholder="輸入新密碼 (至少6碼)" className="w-full border p-3 rounded-xl mb-6 focus:ring-2 focus:ring-blue-500 outline-none text-center tracking-widest" value={newPassword} onChange={e => setNewPassword(e.target.value)} />

                   <div className="flex gap-3">
                       <button onClick={() => setShowPwdModal(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-bold transition-colors">取消</button>
                       <button 
                           onClick={handleChangePassword} 
                           disabled={loading}
                           className={`flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-md flex items-center justify-center ${loading ? 'opacity-70' : 'hover:bg-blue-700'}`}
                       >
                           {loading ? '處理中...' : '確認修改'}
                       </button>
                   </div>
                </div>
             </div>
           )}
           
           {showApprovalModal && approvedResult && (
               <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
                   <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-sm text-center relative border-t-4 border-green-500">
                       <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 shadow-sm">
                           <Check className="w-8 h-8" />
                       </div>
                       <h3 className="text-2xl font-bold text-gray-800 mb-2">重設成功！</h3>
                       <p className="text-gray-500 mb-6">
                           用戶 <strong className="text-gray-800">{approvedResult.name}</strong> 的密碼已更新。
                       </p>
                       <div className="bg-gray-100 p-6 rounded-xl border border-gray-200 mb-6 relative group">
                           <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">臨時密碼</p>
                           <p className="text-4xl font-mono font-bold text-gray-800 tracking-widest select-all">{approvedResult.pwd}</p>
                       </div>
                       <p className="text-sm text-red-500 mb-6 font-medium bg-red-50 p-2 rounded-lg">請立即口頭告知用戶，並要求其登入後修改密碼。</p>
                       <button onClick={() => setShowApprovalModal(false)} className="w-full bg-green-600 hover:bg-green-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-green-200 transition-all transform hover:scale-[1.02]">
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