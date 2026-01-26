'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

// ==========================================
// [⚠️ 環境切換說明：請在 VS Code 中閱讀此段]
//
// 目前為了讓您在線上能看到畫面，預設開啟 [模擬模式]。
// 當您要部署到 Vercel 時，請執行以下 3 步驟：
//
// 1. 確保終端機已執行安裝: npm install @supabase/supabase-js
// 2. [解除註解] 下方的「正式連線區塊 (A)」
// 3. [刪除] 下方的「模擬連線區塊 (B)」的內容 (但請保留最上方的變數宣告)
// ==========================================

// --- 全域變數宣告 (請保留此處，避免刪除區塊後報錯) ---
let mockUser: any = null;
let mockDb: any = undefined; 

// --- [A. 正式連線區塊] (請在 VS Code 中解除這裡的註解) ---
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



export default function RegistrationApp() {
  const [notes, setNotes] = useState<any[]>([]);
  const [bulletins, setBulletins] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]); 
  const [user, setUser] = useState<any>(null);
  
  // 選項資料 State
  const [teamBigOptions, setTeamBigOptions] = useState<any[]>([]);
  const [teamSmallOptions, setTeamSmallOptions] = useState<any[]>([]);
  const [newOptionValue, setNewOptionValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [username, setUsername] = useState('');
  const [idLast4, setIdLast4] = useState(''); 
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 預設登入後進入公告欄
  const [activeTab, setActiveTab] = useState<'form' | 'history' | 'admin_data' | 'admin_users' | 'admin_settings' | 'bulletin'>('bulletin');
  const [filterMonth, setFilterMonth] = useState('');

  // 公告欄位
  const [bulletinText, setBulletinText] = useState('');
  const [bulletinImage, setBulletinImage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 修改密碼相關 State
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [pwdTargetUser, setPwdTargetUser] = useState<any>(null);

  // 管理員新增使用者相關 State
  const [addUserName, setAddUserName] = useState('');
  const [addUserLast4, setAddUserLast4] = useState('');
  const [addUserPwd, setAddUserPwd] = useState('');

  // 設定管理員帳號
  const ADMIN_ACCOUNT = 'admin'; 

  const [formData, setFormData] = useState({
    team_big: '', 
    team_small: '',
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
  
  const [supabase] = useState(() => createClient());
  const FAKE_DOMAIN = "@my-notes.com";

  // === 轉碼工具 ===
  const encodeName = (name: string) => {
    try {
      let hex = '';
      for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i).toString(16);
        hex += ('0000' + char).slice(-4);
      }
      return hex;
    } catch { return name; }
  };

  const decodeName = (email: string) => {
    try {
      const hex = email.split('@')[0];
      let str = '';
      for (let i = 0; i < hex.length; i += 4) {
        str += String.fromCharCode(parseInt(hex.substr(i, 4), 16));
      }
      return str;
    } catch { return email ? email.split('@')[0] : '使用者'; }
  };

  const getDisplayNameOnly = (email: string) => {
    const fullName = decodeName(email);
    if (fullName.length > 4 && !isNaN(Number(fullName.slice(-4)))) {
      return fullName.slice(0, -4);
    }
    return fullName;
  };

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

  const isAdmin = user ? getDisplayNameOnly(user.email || '') === ADMIN_ACCOUNT : false;

  // 讀取系統選項
  const fetchOptions = useCallback(async () => {
    try {
      // 讀取大隊選項
      const { data: bigData } = await supabase
        .from('system_options')
        .select('*')
        .eq('category', 'team_big')
        .order('created_at', { ascending: true }); 
      
      setTeamBigOptions(bigData || []);
      if (bigData && bigData.length > 0) {
          setFormData(prev => ({...prev, team_big: prev.team_big || bigData[0].value}));
      } else {
          setTeamBigOptions([{id: 0, value: '觀音隊'}]); 
      }

      // 讀取小隊選項
      const { data: smallData } = await supabase
        .from('system_options')
        .select('*')
        .eq('category', 'team_small')
        .order('created_at', { ascending: true });

      setTeamSmallOptions(smallData || []);
      if (smallData && smallData.length > 0) {
          setFormData(prev => ({...prev, team_small: prev.team_small || smallData[0].value}));
      } else {
          setTeamSmallOptions([{id: 0, value: '第1小隊'}]); 
      }
    } catch (e) { console.error(e); }
  }, [supabase]);

  const handleAddOption = async (category: 'team_big' | 'team_small') => {
      if (!newOptionValue.trim()) return alert('請輸入選項名稱');
      setLoading(true);
      const { error } = await supabase.from('system_options').insert([
          { category, value: newOptionValue.trim() }
      ]);
      if (error) alert('新增失敗: ' + error.message);
      else {
          setNewOptionValue('');
          fetchOptions();
      }
      setLoading(false);
  };

  const handleDeleteOption = async (id: number) => {
      if (!confirm('確定刪除此選項？')) return;
      setLoading(true);
      const { error } = await supabase.from('system_options').delete().eq('id', id);
      if (error) alert('刪除失敗: ' + error.message);
      else fetchOptions();
      setLoading(false);
  };

  // [移除] handleInitializeDefaults 功能

  const exportToExcel = () => {
    const dataToExport = getFilteredNotes();
    if (dataToExport.length === 0) {
      alert("目前沒有資料可匯出");
      return;
    }
    const headers = [
      "大隊", "小隊", "精舍", "姓名", "身分證後四碼", "法名", "動作", 
      "開始日期", "開始時間", "結束日期", "結束時間", "需協助", "備註", "登記時間", "填表人"
    ];
    const csvRows = [
      headers.join(','),
      ...dataToExport.map(note => [
        note.team_big,
        note.team_small,
        note.monastery,
        note.real_name,
        note.id_2 || '',
        note.dharma_name || '',
        note.action_type,
        note.start_date,
        note.start_time,
        note.end_date,
        note.end_time,
        note.need_help ? '是' : '否',
        `"${(note.memo || '').replace(/"/g, '""')}"`,
        new Date(note.created_at).toLocaleDateString(),
        note.sign_name || '' 
      ].join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `報名資料匯出_${filterMonth || '全部'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredNotes = () => {
    if (!filterMonth) return notes; 
    return notes.filter(note => note.start_date && note.start_date.startsWith(filterMonth));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { 
        alert('圖片大小請勿超過 1MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBulletinImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostBulletin = async () => {
    if (!bulletinText && !bulletinImage) return alert('請輸入文字或上傳圖片');
    setLoading(true);
    const { error } = await supabase.from('bulletins').insert([
      { content: bulletinText, image_url: bulletinImage }
    ]);

    if (error) {
      alert('發布失敗：' + error.message);
    } else {
      alert('公告發布成功！');
      setBulletinText('');
      setBulletinImage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchBulletins();
    }
    setLoading(false);
  };

  const handleDeleteBulletin = async (id: number) => {
    if (!confirm('確定要撤除此公告嗎？')) return;

    setLoading(true);
    const { error } = await supabase.from('bulletins').delete().eq('id', id);
    if (error) {
      alert('撤除失敗：' + error.message);
    } else {
      alert('公告已撤除。');
      setBulletins(prev => prev.filter(b => b.id !== id));
      fetchBulletins(); 
    }
    setLoading(false);
  };

  const handleToggleDeleteNote = async (id: number, currentStatus: boolean) => {
    if (!currentStatus && !confirm('確定要標記「刪除」此報名資料嗎？\n(資料仍會保留在列表中，但會顯示為刪除)')) return;

    setLoading(true);
    const newStatus = !currentStatus;

    if (mockDb) {
        if (mockDb.notes) {
            mockDb.notes = mockDb.notes.map((n: any) => n.id === id ? { ...n, is_deleted: newStatus } : n);
        }
        setNotes(prev => prev.map(n => n.id === id ? { ...n, is_deleted: newStatus } : n));
        if (isAdmin) fetchAllUsers();
        setLoading(false);
        return;
    }

    const { data, error } = await supabase
      .from('notes')
      .update({ is_deleted: newStatus })
      .eq('id', id)
      .select();

    if (error) {
      alert('更新失敗：' + error.message);
    } else if (data && data.length === 0) {
      alert('權限錯誤：無法修改資料。請檢查 RLS。');
    } else {
      setNotes(prev => prev.map(n => n.id === id ? { ...n, is_deleted: newStatus } : n));
      if (isAdmin) fetchAllUsers();
    }
    setLoading(false);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      return alert('密碼長度需至少 6 碼');
    }
    setLoading(true);

    if (pwdTargetUser === 'SELF') {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) alert('修改失敗：' + error.message);
      else alert('密碼修改成功！');
    } else {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
          alert('提示：由於 Supabase 安全限制，正式環境中無法在前端直接修改他人密碼。\n請使用 Supabase Dashboard 或後端 API 發送重設信。');
      } else {
          alert(`[模擬] 已強制修改使用者 ${pwdTargetUser.display_name} 的密碼為: ${newPassword}`);
      }
    }

    setLoading(false);
    setShowPwdModal(false);
    setNewPassword('');
  };

  const handleAdminAddUser = async () => {
    if(!addUserName || !addUserLast4 || !addUserPwd) return alert('請輸入完整資料');
    if(addUserLast4.length !== 4) return alert('ID 後四碼需為 4 碼');
    
    setLoading(true);
    const uniqueId = addUserName + addUserLast4;
    const email = encodeName(uniqueId) + FAKE_DOMAIN;

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        alert('注意：正式環境下，此操作會導致您(管理員)被登出並登入新帳號。\n若要不登出建立帳號，需使用後端 API。');
    }

    const { error } = await supabase.auth.signUp({
        email,
        password: addUserPwd,
        options: {
            data: {
                display_name: addUserName,
                full_name: addUserName,
                id_last4: addUserLast4
            }
        }
    });

    if (error) {
        alert('新增失敗：' + error.message);
    } else {
        alert(`使用者 ${addUserName} 已建立！`);
        setAddUserName('');
        setAddUserLast4('');
        setAddUserPwd('');
        fetchAllUsers(); 
    }
    setLoading(false);
  };

  const handleAdminDeleteUser = async (targetId: string) => {
    if (!confirm('確定要刪除此使用者嗎？此動作無法復原！')) return;
    setLoading(true);

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        alert('提示：由於 Supabase 安全限制，前端無法直接刪除使用者。\n請使用 Supabase Dashboard 進行操作。');
    } else {
        // @ts-ignore
        if (supabase.auth.admin && supabase.auth.admin.deleteUser) {
             // @ts-ignore
             await supabase.auth.admin.deleteUser(targetId);
             alert('[模擬] 使用者已刪除');
             fetchAllUsers(); 
        }
    }
    setLoading(false);
  };

  // [修改] 讀取所有使用者 (統計報名筆數)
  const fetchAllUsers = useCallback(async () => {
    let allNotes = [];
    try {
        if (mockDb && mockDb.notes) {
            allNotes = [...mockDb.notes];
        } else {
            const { data } = await supabase
                .from('notes')
                .select('sign_name, id_2, real_name, dharma_name')
                .order('created_at', { ascending: false });
            allNotes = data || [];
        }

        const userMap = new Map();
        allNotes.forEach((note: any) => {
            // [關鍵修改] 這裡的邏輯：
            // 我們要找的是「填表人」的資料。
            // 由於系統沒有獨立的使用者設定檔，我們嘗試從報名表中，找出該填表人「自己幫自己報名」的那一筆資料，來取得他的法名。
            
            // 1. 解析填表人姓名 (格式: 姓名 (ID))
            let signerNameRaw = note.sign_name || '未知使用者';
            let pureSignerName = signerNameRaw;
            let idPart = note.id_2 || ''; // 預設使用該筆資料的 ID

            if (signerNameRaw.includes('(')) {
                const parts = signerNameRaw.split('(');
                pureSignerName = parts[0].trim();
                idPart = parts[1].replace(')', '').trim();
            }

            // 2. 建立 Key
            const uniqueKey = `${pureSignerName}-${idPart}`;

            if (!userMap.has(uniqueKey)) {
                userMap.set(uniqueKey, {
                    display_name: pureSignerName,
                    id_last4: idPart,
                    dharma: '', // 預設法名為空
                    count: 0
                });
            }

            const currentUser = userMap.get(uniqueKey);
            currentUser.count += 1;

            // 3. 嘗試抓取法名：
            // 如果這筆資料的「報名者姓名 (real_name)」等於「填表人姓名 (pureSignerName)」，
            // 那我們就假設這筆資料的法名，就是填表人的法名。
            if (note.real_name === pureSignerName && note.dharma_name) {
                currentUser.dharma = note.dharma_name;
            }
        });

        setAllUsers(Array.from(userMap.values()));
    } catch(e) { console.error('Fetch users error', e); }
  }, [supabase]);

  useEffect(() => {
    if (activeTab === 'admin_users' && isAdmin) {
        fetchAllUsers();
    }
  }, [activeTab, isAdmin, fetchAllUsers]);

  const fetchBulletins = async () => {
    try {
      const { data, error } = await supabase
        .from('bulletins')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setBulletins(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const currentName = getDisplayNameOnly(user.email || '');
        setFormData(prev => ({ ...prev, real_name: currentName }));
        fetchNotes(user);
        fetchBulletins();
        fetchOptions(); 
        
        if (getDisplayNameOnly(user.email || '').toLowerCase() === ADMIN_ACCOUNT.toLowerCase()) {
           fetchAllUsers();
        }
      }
    };
    getUser();
  }, [fetchOptions]); 

  const fetchNotes = async (targetUser: any = user) => {
    try {
      // @ts-ignore
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        // @ts-ignore
        .order('start_date', { ascending: true })
        // @ts-ignore
        .order('start_time', { ascending: true });
      
      if (error) console.error('讀取失敗:', error);
      else if (data) setNotes(data);
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
    if (!user) return alert('請先登入');

    if (!formData.monastery || !formData.real_name || !formData.action_type || 
        !formData.start_date || !formData.start_time || !formData.end_date || !formData.end_time) {
      return alert('請確認所有必填欄位皆已填寫');
    }

    if (formData.monastery.length > 2) return alert('精舍欄位限填2個字');
    if (formData.dharma_name && formData.dharma_name.length > 2) return alert('法名欄位限填2個字');
    
    const currentId2 = getIdLast4FromEmail(user.email || '');
    // [修改] sign_name 只寫入姓名 (不再包含 ID)
    const signNameOnly = getDisplayNameOnly(user.email || '');

    const insertData = {
      ...formData,
      id_2: currentId2,
      user_id: user.id,
      sign_name: signNameOnly, 
      content: `【${formData.action_type}】${formData.team_big}-${formData.team_small} ${formData.real_name}`,
      is_deleted: false 
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
      if (isAdmin) fetchAllUsers();
      setActiveTab('history');
    } else {
      // @ts-ignore
      alert('寫入失敗：' + error.message);
    }
  };

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setNotes([]);
    setBulletins([]);
    setUsername('');
    setIdLast4('');
    setPassword('');
    setActiveTab('bulletin');
  }, [supabase.auth]);

  useEffect(() => {
    if (!user) return;
    const AUTO_LOGOUT_TIME = 15 * 60 * 1000; 
    let timeoutId: NodeJS.Timeout;

    const performAutoLogout = () => {
      alert("您已閒置超過 15 分鐘，系統將自動登出以確保安全。");
      handleLogout();
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(performAutoLogout, AUTO_LOGOUT_TIME);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [user, handleLogout]);

  const handleSignUp = async () => {
    if (!username || !idLast4 || !password) return alert("請輸入完整資料");
    if (idLast4.length !== 4) return alert("身分證後四碼必須為 4 位數字");

    setLoading(true);
    const uniqueId = username + idLast4;
    const email = encodeName(uniqueId) + FAKE_DOMAIN; 
    
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          display_name: username,
          full_name: username,
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
      fetchBulletins();
      if (username.toLowerCase() === ADMIN_ACCOUNT) {
          fetchAllUsers();
      }
      await recordLogin(uniqueId, '註冊');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    if (!username || !idLast4 || !password) return alert("請輸入完整資料");
    setLoading(true);
    const uniqueId = username + idLast4;
    const email = encodeName(uniqueId) + FAKE_DOMAIN;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert('登入失敗：' + error.message);
    } else {
      setUser(data.user);
      setFormData(prev => ({ ...prev, real_name: username }));
      fetchNotes(data.user);
      fetchBulletins();
      if (username.toLowerCase() === ADMIN_ACCOUNT) {
          fetchAllUsers();
      }
      await recordLogin(uniqueId, '登入');
    }
    setLoading(false);
  };

  const openPwdModal = (target: any) => {
    setPwdTargetUser(target);
    setNewPassword('');
    setShowPwdModal(true);
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
              <input type="text" placeholder="例如：王小明" value={username} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900" onChange={(e) => setUsername(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">身分證後四碼</label>
              <input type="text" maxLength={4} placeholder="例如：1234 (避免同名混淆)" value={idLast4} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900" onChange={(e) => setIdLast4(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">密碼</label>
              <input type="password" placeholder="請輸入密碼" value={password} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-gray-900" onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 mt-8">
            <button onClick={handleLogin} disabled={loading} className="flex-1 bg-amber-700 text-white py-3 rounded-lg font-medium hover:bg-amber-800 transition shadow-sm">{loading ? '...' : '登入'}</button>
            <button onClick={handleSignUp} disabled={loading} className="flex-1 bg-white text-amber-700 border border-amber-300 py-3 rounded-lg font-medium hover:bg-amber-50 transition">註冊</button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl animate-fade-in">
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-amber-100">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isAdmin ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                {(getDisplayNameOnly(user.email || '') || 'U')[0]}
              </div>
              <div className="flex flex-col">
                <span className="text-gray-700 font-medium flex items-center gap-2">
                   嗨，{getDisplayNameOnly(user.email || '')} 
                   {isAdmin && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">管理員</span>}
                </span>
                <span className="text-xs text-gray-400">ID: {decodeName(user.email || '').slice(-4)}</span>
              </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => openPwdModal('SELF')} className="text-sm bg-blue-50 text-blue-600 hover:text-blue-800 border border-blue-200 px-3 py-1 rounded-md hover:bg-blue-100 transition shadow-sm font-bold">🔑 修改密碼</button>
                <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-red-500 px-3 py-1 rounded-md hover:bg-red-50 transition">登出</button>
            </div>
          </div>

          <div className="flex mb-6 bg-amber-100 p-1 rounded-lg w-full overflow-x-auto">
            <button onClick={() => setActiveTab('bulletin')} className={`flex-1 py-3 px-2 whitespace-nowrap rounded-md font-bold transition-all ${activeTab === 'bulletin' ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-600 hover:bg-amber-200/50'}`}>📢 公告欄</button>
            <button onClick={() => setActiveTab('form')} className={`flex-1 py-3 px-2 whitespace-nowrap rounded-md font-bold transition-all ${activeTab === 'form' ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-600 hover:bg-amber-200/50'}`}>📝 我要報名</button>
            <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 px-2 whitespace-nowrap rounded-md font-bold transition-all ${activeTab === 'history' ? 'bg-white text-amber-800 shadow-sm' : 'text-amber-600 hover:bg-amber-200/50'}`}>📋 我的紀錄</button>
            {isAdmin && (
              <>
                <button 
                  onClick={() => setActiveTab('admin_data')} 
                  className={`flex-1 py-3 px-2 whitespace-nowrap rounded-md font-bold transition-all ${
                    activeTab === 'admin_data' 
                      ? 'bg-red-50 text-red-800 shadow-sm border border-red-200' 
                      : 'text-red-600 hover:bg-red-50/50'
                  }`}
                >
                  📊 全部報名資料
                </button>
                <button 
                  onClick={() => setActiveTab('admin_users')} 
                  className={`flex-1 py-3 px-2 whitespace-nowrap rounded-md font-bold transition-all ${
                    activeTab === 'admin_users' 
                      ? 'bg-blue-50 text-blue-800 shadow-sm border border-blue-200' 
                      : 'text-blue-600 hover:bg-blue-50/50'
                  }`}
                >
                  👥 使用者
                </button>
                <button onClick={() => setActiveTab('admin_settings')} className={`flex-1 py-3 px-2 whitespace-nowrap rounded-md font-bold transition-all ${activeTab === 'admin_settings' ? 'bg-gray-700 text-white shadow-sm border border-gray-600' : 'text-gray-600 hover:bg-gray-200/50'}`}>⚙️ 系統設定</button>
              </>
            )}
          </div>

          {activeTab === 'bulletin' && (
            <div className="space-y-6 animate-fade-in">
              {isAdmin && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-orange-200">
                  <h3 className="text-lg font-bold text-orange-800 mb-4">📢 發布新公告 (管理員專用)</h3>
                  <textarea className="w-full p-3 border border-orange-200 rounded-lg mb-3 focus:ring-2 focus:ring-orange-500 text-gray-900" rows={3} placeholder="輸入公告內容..." value={bulletinText} onChange={(e) => setBulletinText(e.target.value)} />
                  <div className="flex gap-4 items-center">
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                    <button onClick={handlePostBulletin} disabled={loading} className="ml-auto bg-orange-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-orange-700 transition">{loading ? '發布中...' : '發布'}</button>
                  </div>
                  {bulletinImage && <div className="mt-3"><p className="text-xs text-gray-400 mb-1">預覽圖片：</p><img src={bulletinImage} alt="Preview" className="max-h-40 rounded border border-gray-200" /></div>}
                </div>
              )}
              <div className="space-y-4">
                {bulletins.map((b) => (
                  <div key={b.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group">
                    {isAdmin && <button onClick={() => handleDeleteBulletin(b.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100" title="撤除此公告">🗑️ 撤除</button>}
                    <div className="flex justify-between items-start mb-2"><span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-bold">公告</span><span className="text-xs text-gray-400 mr-10">{new Date(b.created_at).toLocaleDateString()}</span></div>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg mb-4">{b.content}</p>
                    {b.image_url && <img src={b.image_url} alt="公告圖片" className="w-full max-w-2xl rounded-lg border border-gray-100" />}
                  </div>
                ))}
                {bulletins.length === 0 && <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">目前沒有公告</div>}
              </div>
            </div>
          )}

          {activeTab === 'form' && (
            <div className="bg-white p-8 rounded-xl shadow-md border border-amber-100 mb-8 animate-fade-in">
               <h3 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-2 border-b border-amber-100 pb-4">🙏 發心報名資料</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* ... Form fields ... */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">1. 大隊 <span className="text-red-500">*必填</span></label>
                   <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" 
                      value={formData.team_big} 
                      onChange={(e) => setFormData({...formData, team_big: e.target.value})}
                   >
                     {teamBigOptions.map(opt => (
                       <option key={opt.id} value={opt.value}>{opt.value}</option>
                     ))}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">2. 小隊 <span className="text-red-500">*必填</span></label>
                   <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" 
                      value={formData.team_small} 
                      onChange={(e) => setFormData({...formData, team_small: e.target.value})}
                   >
                     {teamSmallOptions.map(opt => (
                       <option key={opt.id} value={opt.value}>{opt.value}</option>
                     ))}
                   </select>
                 </div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">3. 精舍 <span className="text-red-500">*必填 (限2字)</span></label><input type="text" maxLength={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" value={formData.monastery} onChange={(e) => setFormData({...formData, monastery: e.target.value})} /></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">4. 姓名 <span className="text-red-500">*必填</span></label><input type="text" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-amber-500" value={formData.real_name} onChange={(e) => setFormData({...formData, real_name: e.target.value})} /></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">5. 法名</label><input type="text" maxLength={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" value={formData.dharma_name} onChange={(e) => setFormData({...formData, dharma_name: e.target.value})} /></div>
                 <div><label className="block text-sm font-medium text-gray-700 mb-1">6. 新增異動 <span className="text-red-500">*必填</span></label><select className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" value={formData.action_type} onChange={(e) => setFormData({...formData, action_type: e.target.value})}><option value="新增">新增</option><option value="異動">異動</option></select></div>
                 <div className="lg:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">7. 發心起日/時 <span className="text-red-500">*必填</span></label><div className="flex gap-2"><input type="date" className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} /><input type="time" className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" value={formData.start_time} onChange={(e) => setFormData({...formData, start_time: e.target.value})} /></div></div>
                 <div className="lg:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">8. 發心迄日/時 <span className="text-red-500">*必填</span></label><div className="flex gap-2"><input type="date" className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} /><input type="time" className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" value={formData.end_time} onChange={(e) => setFormData({...formData, end_time: e.target.value})} /></div></div>
                 <div className="md:col-span-2 lg:col-span-4"><label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition"><input type="checkbox" className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500" checked={formData.need_help} onChange={(e) => setFormData({...formData, need_help: e.target.checked})} /><span className="text-gray-700 font-medium">9. 是否需要協助報名 (是)</span></label><p className="text-xs text-gray-500 mt-1 ml-9">若在普台學校及中台週邊的居士，需師父協助報名，請勾選。</p></div>
                 <div className="md:col-span-2 lg:col-span-4"><label className="block text-sm font-medium text-gray-700 mb-1">10. 備註</label><textarea rows={2} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900" value={formData.memo} onChange={(e) => setFormData({...formData, memo: e.target.value})} /></div>
               </div>
               <button onClick={handleSubmit} className="w-full bg-amber-700 text-white py-4 rounded-lg font-bold hover:bg-amber-800 transition shadow-lg text-lg mt-8">送出發心資料</button>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* [修改] 歷史紀錄過濾：只顯示自己的資料 (filter by user_id) */}
                {notes.filter(n => n.user_id === user?.id).map((note) => {
                  const completed = isExpired(note.end_date, note.end_time);
                  return (
                    <div key={note.id} className={`bg-white p-5 rounded-xl shadow-sm border transition relative overflow-hidden ${completed ? 'border-gray-200 bg-gray-50/50' : 'border-amber-100 hover:border-amber-300'} ${note.is_deleted ? 'opacity-50 grayscale' : ''}`}>
                      {completed && <div className="absolute top-0 right-0 bg-gray-200 text-gray-500 text-xs font-bold px-3 py-1 rounded-bl-lg z-10">已圓滿</div>}
                      {/* 如果已刪除，顯示刪除標籤 */}
                      {note.is_deleted && <div className="absolute top-0 left-0 bg-red-100 text-red-600 text-xs font-bold px-3 py-1 rounded-br-lg z-10">已刪除</div>}
                      
                      <div className="flex justify-between items-start mb-3">
                         <div className="flex items-center gap-2"><span className={`text-xs px-2 py-1 rounded-full text-white ${note.action_type === '新增' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{note.action_type}</span><h4 className={`font-bold text-lg ${completed ? 'text-gray-500' : 'text-amber-900'}`}>{note.team_big} - {note.team_small}</h4></div>
                      </div>
                      <div className="text-sm text-gray-700 space-y-2">
                         <div className="grid grid-cols-2 gap-2"><p><span className="text-gray-400">精舍：</span>{note.monastery}</p><p><span className="text-gray-400">姓名：</span>{note.real_name}</p><p><span className="text-gray-400">法名：</span>{note.dharma_name || '-'}</p><p><span className="text-gray-400">協助：</span>{note.need_help ? '是' : '否'}</p></div>
                         <div className="border-t border-dashed border-gray-200 pt-2 mt-2"><p className="flex flex-col sm:flex-row sm:gap-2"><span className="text-gray-400 whitespace-nowrap">起：</span><span className={completed ? 'text-gray-500' : 'text-gray-800'}>{note.start_date} {note.start_time}</span></p><p className="flex flex-col sm:flex-row sm:gap-2"><span className="text-gray-400 whitespace-nowrap">迄：</span><span className={completed ? 'text-gray-500' : 'text-gray-800'}>{note.end_date} {note.end_time}</span></p></div>
                         
                         {/* [修改] 顯示填表人 (sign_name + id_2) */}
                         <p className="text-xs text-gray-400 mt-2 border-t pt-2 border-dashed border-gray-100">
                           填表人：{note.sign_name ? `${note.sign_name} (${note.id_2})` : '-'}
                         </p>

                         {/* [新增] 刪除報名表 Checkbox */}
                         <div className="mt-3 pt-2 border-t border-gray-100 flex justify-end">
                            <label className={`flex items-center gap-2 cursor-pointer select-none ${completed ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <span className={`text-sm font-bold ${completed ? 'text-gray-400' : 'text-red-500'}`}>刪除報名表</span>
                                <input 
                                    type="checkbox" 
                                    className="w-4 h-4 text-red-600 rounded focus:ring-red-500 cursor-pointer"
                                    disabled={completed}
                                    checked={note.is_deleted || false} // 綁定狀態
                                    onChange={() => handleToggleDeleteNote(note.id, note.is_deleted)}
                                />
                            </label>
                         </div>

                         {note.memo && <div className="bg-amber-50 p-2 rounded text-xs text-gray-600 mt-2"><span className="font-bold text-amber-700">想說的話：</span>{note.memo}</div>}
                      </div>
                      <p className="text-xs text-right text-gray-300 mt-3">登記於：{new Date(note.created_at).toLocaleDateString()}</p>
                    </div>
                  );
                })}
              </div>
              {notes.filter(n => n.user_id === user?.id).length === 0 && <div className="text-center py-12 bg-white/50 rounded-xl border border-dashed border-gray-300"><p className="text-gray-500">尚無登記紀錄</p></div>}
            </div>
          )}

          {activeTab === 'admin_data' && isAdmin && (
             <div className="space-y-6 animate-fade-in">
               <div className="bg-white p-6 rounded-xl shadow-md border border-red-100">
                 <h3 className="text-lg font-bold text-red-800 mb-4">📋 全部報名資料</h3>
                 <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between mb-4">
                   <div className="w-full md:w-auto"><label className="block text-sm font-bold text-gray-700 mb-2">篩選月份 (發心起日)</label><input type="month" className="w-full p-2 border border-gray-300 rounded-lg text-gray-900" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} /></div>
                   <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition flex items-center gap-2"><span>📊</span> 匯出 Excel (CSV)</button>
                 </div>
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                       {/* [修改] 欄位名稱調整 */}
                       <tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">狀態</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">大隊/小隊</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">精舍</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">姓名</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">法名</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">發心起日時</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">發心迄日時</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">填表人</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">備註</th></tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {getFilteredNotes().map((note) => (
                         <tr key={note.id} className={`hover:bg-gray-50 ${note.is_deleted ? 'bg-red-50 opacity-60' : ''}`}>
                           <td className="px-4 py-4 whitespace-nowrap">
                             <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${note.action_type === '新增' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{note.action_type}</span>
                             {note.is_deleted && <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">已刪除</span>}
                           </td>
                           <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{note.team_big} <span className="text-gray-400">|</span> {note.team_small}</td>
                           <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{note.monastery}</td>
                           {/* [修改] 姓名欄位只顯示姓名 */}
                           <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{note.real_name}</td>
                           <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{note.dharma_name || '-'}</td>
                           <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{note.start_date} {note.start_time}</td>
                           <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{note.end_date} {note.end_time}</td>
                           {/* [修改] 填表人欄位：顯示 姓名 + (ID) */}
                           <td className="px-4 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">{note.sign_name ? `${note.sign_name} (${note.id_2})` : '-'}</td>
                           <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">{note.memo || '-'}</td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'admin_users' && isAdmin && (
             <div className="space-y-6 animate-fade-in">
               <div className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
                 <h3 className="text-lg font-bold text-blue-800 mb-4">👥 使用者管理</h3>
                 
                 {/* 新增使用者表單 */}
                 <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                   <h4 className="text-sm font-bold text-blue-900 mb-2">➕ 新增使用者</h4>
                   <div className="flex flex-col md:flex-row gap-2">
                     <input type="text" placeholder="姓名" className="flex-1 p-2 rounded border border-blue-300 text-sm" value={addUserName} onChange={(e) => setAddUserName(e.target.value)} />
                     <input type="text" placeholder="身分證後四碼" maxLength={4} className="w-full md:w-32 p-2 rounded border border-blue-300 text-sm" value={addUserLast4} onChange={(e) => setAddUserLast4(e.target.value)} />
                     <input type="text" placeholder="預設密碼" className="flex-1 p-2 rounded border border-blue-300 text-sm" value={addUserPwd} onChange={(e) => setAddUserPwd(e.target.value)} />
                     <button onClick={handleAdminAddUser} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-sm hover:bg-blue-700 whitespace-nowrap">新增</button>
                   </div>
                 </div>

                 {/* [修改] 提示訊息 */}
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-500">有報名過的使用者，才會出現在列表上</p>
                    <p className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded">⚠️ 欲修改使用者資料，請至後端，以註冊者權限修改</p>
                 </div>
                 
                 <div className="bg-white rounded-lg border border-gray-200 overflow-hidden overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">登入者姓名 (填表人)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID 後四碼</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">報名筆數</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {allUsers.length > 0 ? allUsers.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    {/* [修改] 顯示欄位：姓名、ID、筆數 */}
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.display_name} {u.dharma ? `(${u.dharma})` : ''}</td>
                                    <td className="px-4 py-3 text-sm text-gray-500">{u.id_last4}</td>
                                    <td className="px-4 py-3 text-right text-sm font-medium text-blue-600">{u.count} 筆</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={3} className="px-4 py-8 text-center text-sm text-gray-500">暫無使用者資料</td></tr>
                            )}
                        </tbody>
                    </table>
                 </div>
               </div>
             </div>
          )}

          {activeTab === 'admin_settings' && isAdmin && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">⚙️ 下拉選單設定</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* 大隊設定 */}
                  <div>
                    <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">大隊選項</h4>
                    <ul className="space-y-2 mb-4">
                      {teamBigOptions.map(opt => (
                        <li key={opt.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700">{opt.value}</span>
                          <button onClick={() => handleDeleteOption(opt.id)} className="text-xs text-red-500 hover:text-red-700">刪除</button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                       <input type="text" placeholder="新增大隊..." className="flex-1 p-2 text-sm border rounded" value={selectedCategory === 'team_big' ? newOptionValue : ''} 
                              onChange={(e) => { setNewOptionValue(e.target.value); setSelectedCategory('team_big'); }} />
                       <button onClick={() => handleAddOption('team_big')} className="text-sm bg-gray-600 text-white px-3 rounded hover:bg-gray-700">新增</button>
                    </div>
                    {/* [新增] 匯入預設選項按鈕 */}
                    <button onClick={handleInitializeDefaults} className="mt-4 text-xs text-blue-500 hover:text-blue-700 underline">匯入預設選項 (若列表為空請點此)</button>
                  </div>

                  {/* 小隊設定 */}
                  <div>
                    <h4 className="font-bold text-gray-700 mb-2 border-b pb-1">小隊選項</h4>
                    <ul className="space-y-2 mb-4">
                      {teamSmallOptions.map(opt => (
                        <li key={opt.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                          <span className="text-sm text-gray-700">{opt.value}</span>
                          <button onClick={() => handleDeleteOption(opt.id)} className="text-xs text-red-500 hover:text-red-700">刪除</button>
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2">
                       <input type="text" placeholder="新增小隊..." className="flex-1 p-2 text-sm border rounded" value={selectedCategory === 'team_small' ? newOptionValue : ''} 
                              onChange={(e) => { setNewOptionValue(e.target.value); setSelectedCategory('team_small'); }} />
                       <button onClick={() => handleAddOption('team_small')} className="text-sm bg-gray-600 text-white px-3 rounded hover:bg-gray-700">新增</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 修改密碼 Modal */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {pwdTargetUser === 'SELF' ? '修改我的密碼' : `修改 ${pwdTargetUser.display_name} 的密碼`}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {pwdTargetUser === 'SELF' ? '請輸入您的新密碼。' : '⚠️ 您正在強制修改他人密碼，請謹慎操作。'}
            </p>
            <input 
              type="password" 
              placeholder="輸入新密碼 (至少6碼)" 
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 text-gray-900"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowPwdModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">取消</button>
              <button onClick={handleChangePassword} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {loading ? '處理中...' : '確認修改'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}