import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'

function normalizeGender(value) {
  const raw = (value || '').toString().trim().toLowerCase()
  if (['male', 'nam', 'm'].includes(raw)) return 'MALE'
  if (['female', 'nữ', 'nu', 'n'].includes(raw)) return 'FEMALE'
  return ''
}

function renderGender(value) {
  const norm = normalizeGender(value)
  if (norm === 'MALE') return 'Nam'
  if (norm === 'FEMALE') return 'Nữ'
  return ''
}

const roleLabel = { ADMIN:'Quản trị', STAFF:'Nhân viên', TEACHER:'Giáo viên', STUDENT:'Học sinh', PARENT:'Phụ huynh' }
const allowedRoles = Object.keys(roleLabel)

function formatIsoToDdMmYyyy(iso){
  if (!iso) return ''
  try {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  } catch (_err) {
    return ''
  }
}

export default function AdminUsers(){
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [gender, setGender] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [birthdateText, setBirthdateText] = useState('')
  const [role, setRole] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [msg, setMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [roleLists, setRoleLists] = useState({})
  const [activeRole, setActiveRole] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState('id')
  const [sortDir, setSortDir] = useState('asc')
  const [filterGender, setFilterGender] = useState('')
  const hiddenDateRef = useRef(null)

  async function loadByRole(role){
    if (!allowedRoles.includes(role)) return
    try{
      const { data } = await axios.get('/api/admin/users', { params: { role } })
      setRoleLists(prev => ({ ...prev, [role]: data }))
    }catch(_e){
      setRoleLists(prev => ({ ...prev, [role]: [] }))
    }
  }

  useEffect(()=>{
    setCurrentPage(1)
    setSearchQuery('')
    setSortKey('id')
    setSortDir('asc')
  }, [activeRole])
  
  function generatePassword(usernameVal, birthdateVal){
    const lower = (usernameVal || '').toLowerCase()
    const noAccents = lower.normalize('NFD').replace(/\p{Diacritic}+/gu, '')
    const compact = noAccents.replace(/\s+/g, '')
    const digits = (birthdateVal || '').replaceAll('-', '')
    const dd = digits.slice(6, 8)
    const mm = digits.slice(4, 6)
    return compact + dd + mm
  }

  function validate(){
    const next = {}
    // Chỉ yêu cầu email hợp lệ nếu không phải học sinh/phụ huynh
    if (role !== 'STUDENT' && role !== 'PARENT' && !/^([^\s@]+)@([^\s@]+)\.[^\s@]{2,}$/.test(email)) {
      next.email = 'Email không hợp lệ (phải có tên miền)'
    }
    if (!username.trim()) next.username = 'Nhập họ và tên'
    const isoFromText = (()=>{
      const m = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(birthdateText)
      return m ? `${m[3]}-${m[2]}-${m[1]}` : ''
    })()
    if (!birthdate && !isoFromText) next.birthdate = 'Chọn ngày sinh (dd/mm/yyyy)'
    if (!gender) next.gender = 'Chọn giới tính'
    if (phone && !/^\d{10}$/.test(phone)) next.phone = 'Số điện thoại phải đủ 10 số'
    if (!role) next.role = 'Chọn quyền'
    if (role && !allowedRoles.includes(role)) next.role = 'Quyền không hợp lệ'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function createUser(){
    setMsg('')
    setSuccessMsg('')
    if (!validate()) return
    try{
      let isoBirth = birthdate
      if (!isoBirth && birthdateText) {
        const m = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(birthdateText)
        if (m) isoBirth = `${m[3]}-${m[2]}-${m[1]}`
      }
      const finalPassword = password && password.length? password : generatePassword(username, isoBirth)
      if (!allowedRoles.includes(role)) {
        setMsg('Quyền không hợp lệ')
        setErrors(prev => ({ ...prev, role: 'Quyền không hợp lệ' }))
        return
      }
      const payload = { email, username, gender: normalizeGender(gender) || null, birthdate: isoBirth, role, phone, password: finalPassword }
      const { data } = await axios.post('/api/admin/users', payload)
      setSuccessMsg('Tạo thành công: ' + data.id)
      try{
        if (activeRole === role) {
          await loadByRole(role)
        } else if (!activeRole) {
          setActiveRole(role)
          await loadByRole(role)
        }
      }catch(_e){}
      setEmail(''); setUsername(''); setGender(''); setBirthdate(''); setBirthdateText(''); setRole(''); setPhone(''); setPassword(''); setErrors({})
    }catch(err){
      const apiMsg = err?.response?.data?.error || 'Lỗi tạo tài khoản'
      setMsg(apiMsg)
      if (apiMsg && apiMsg.toLowerCase().includes('email')) {
        setErrors(prev => ({ ...prev, email: 'Email đã có trong cơ sở dữ liệu' }))
      }
    }
  }

  const genderOptions = useMemo(()=>[
    { value:'MALE', label:'Nam' },
    { value:'FEMALE', label:'Nữ' }
  ], [])

  return (
    <div className="user-page">
      <div className="card user-top-card">
        <h3>Quản lý tài khoản (Admin)</h3>
        <div className="user-form-grid">
          <div className={`field${errors.email ? ' has-error' : ''}`}>
            <label className="field-label">Email đăng nhập{(role === 'STUDENT' || role === 'PARENT') ? ' (không bắt buộc)' : ''}</label>
            <input className={`input${errors.email? ' input-error':''}`} placeholder={(role === 'STUDENT' || role === 'PARENT') ? 'Email (không bắt buộc)' : 'Email'} value={email} onChange={e=>setEmail(e.target.value)} autoComplete="off" name="admin_create_email" />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>
          <div className={`field${errors.username ? ' has-error' : ''}`}>
            <label className="field-label">Họ và tên</label>
            <input className={`input${errors.username? ' input-error':''}`} placeholder="Họ và tên" value={username} onChange={e=>setUsername(e.target.value)} autoComplete="off" name="admin_create_username" />
            {errors.username && <div className="field-error">{errors.username}</div>}
          </div>
          <div className={`field${errors.gender ? ' has-error' : ''}`}>
            <label className="field-label">Giới tính</label>
            <select className={`input${errors.gender? ' input-error':''}`} value={gender} onChange={e=>setGender(e.target.value)}>
              <option value="">-- Chọn giới tính --</option>
              {genderOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {errors.gender && <div className="field-error">{errors.gender}</div>}
          </div>
          <div className={`field${errors.birthdate ? ' has-error' : ''}`}>
            <label className="field-label">Ngày sinh</label>
            <div className="field-inline">
              <input className={`input${errors.birthdate? ' input-error':''}`} placeholder="dd/mm/yyyy" value={birthdateText} onChange={e=>setBirthdateText(e.target.value)} inputMode="numeric" autoComplete="off" name="admin_create_birthdate_text" />
              <input ref={hiddenDateRef} type="date" className="field-date-hidden" value={birthdate} onChange={e=>{ const iso = e.target.value; setBirthdate(iso); setBirthdateText(formatIsoToDdMmYyyy(iso)); setErrors(prev=>({...prev, birthdate: undefined})); }} tabIndex={-1} aria-hidden="true" />
              <button type="button" className="btn secondary" onClick={()=>hiddenDateRef.current && (hiddenDateRef.current.showPicker ? hiddenDateRef.current.showPicker() : hiddenDateRef.current.click())}>Chọn</button>
            </div>
            {errors.birthdate && <div className="field-error">{errors.birthdate}</div>}
          </div>
          <div className={`field${errors.role ? ' has-error' : ''}`}>
            <label className="field-label">Quyền truy cập</label>
            <select className={`input${errors.role? ' input-error':''}`} value={role} onChange={e=>setRole(e.target.value)}>
              <option value="">-- Chọn quyền --</option>
              {allowedRoles.map(r => (
                <option key={r} value={r}>{`${r} • ${roleLabel[r]}`}</option>
              ))}
            </select>
            {errors.role && <div className="field-error">{errors.role}</div>}
          </div>
          <div className={`field${errors.phone ? ' has-error' : ''}`}>
            <label className="field-label">Số điện thoại</label>
            <input className={`input${errors.phone? ' input-error':''}`} placeholder="Số điện thoại (10 số)" value={phone} onChange={e=>setPhone(e.target.value)} autoComplete="off" name="admin_create_phone" />
            {errors.phone && <div className="field-error">{errors.phone}</div>}
          </div>
          <div className="field">
            <label className="field-label">Mật khẩu ban đầu</label>
            <input className="input" type="password" placeholder="Để trống để tạo tự động" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" name="admin_create_password" />
          </div>
        </div>
        {msg && <div className="user-alert user-alert--error">{msg}</div>}
        {successMsg && <div className="user-alert user-alert--success">{successMsg}</div>}
        <div className="user-actions">
          <button className="btn" onClick={createUser}>Tạo tài khoản</button>
        </div>
      </div>

      <div className="card user-list-card">
        <div className="row" style={{justifyContent:'flex-start', flexWrap:'wrap'}}>
          {allowedRoles.map(r => (
            <button key={r} className={`btn ${activeRole===r? '': 'secondary'} mt16`} onClick={async ()=>{ setActiveRole(r); if (!roleLists[r]) await loadByRole(r) }}>Danh sách {roleLabel[r]}</button>
          ))}
          <button className={`btn ${activeRole===''? '': 'secondary'} mt16`} onClick={()=> setActiveRole('')}>Ẩn</button>
        </div>
        <div className="mt16" style={{minHeight:200}}>
          <h3 style={{marginTop:0}}>{activeRole? `Danh sách ${roleLabel[activeRole]}` : 'Chọn nhóm tài khoản để xem'}</h3>
          {activeRole && (
            <div className="mt16">
              {!(roleLists[activeRole] && roleLists[activeRole].length) ? <div>Không có dữ liệu</div> : (
                <>
                  <div className="user-toolbar">
                    <input className="input user-toolbar__item user-toolbar__item--search" placeholder="Tìm theo tên hoặc email" value={searchQuery} onChange={e=>{ setSearchQuery(e.target.value); setCurrentPage(1) }} />
                    <select className="input user-toolbar__item" value={sortKey} onChange={e=>{ setSortKey(e.target.value); setCurrentPage(1) }}>
                      <option value="id">Sắp xếp theo: ID</option>
                      <option value="username">Sắp xếp theo: Tên</option>
                    </select>
                    <select className="input user-toolbar__item" value={sortDir} onChange={e=>{ setSortDir(e.target.value); setCurrentPage(1) }}>
                      <option value="asc">Tăng dần</option>
                      <option value="desc">Giảm dần</option>
                    </select>
                    <select className="input user-toolbar__item" value={pageSize} onChange={e=>{ setPageSize(parseInt(e.target.value,10)); setCurrentPage(1) }}>
                      <option value={5}>5 / trang</option>
                      <option value={10}>10 / trang</option>
                      <option value={100}>100 / trang</option>
                    </select>
                    <select className="input user-toolbar__item" value={filterGender} onChange={e=>{ setFilterGender(e.target.value); setCurrentPage(1) }}>
                      <option value="">Giới tính: tất cả</option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                    </select>
                  </div>
                  <TableWithPaging
                    rows={roleLists[activeRole]}
                    searchQuery={searchQuery}
                    sortKey={sortKey}
                    sortDir={sortDir}
                    pageSize={pageSize}
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    activeRole={activeRole}
                    onReload={()=>loadByRole(activeRole)}
                    filterGender={filterGender}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EditableRow({ user, onUpdated, onDeleted }){
  const [editing, setEditing] = useState(false)
  const [email, setEmail] = useState(user.email || '')
  const [username, setUsername] = useState(user.username || '')
  const [gender, setGender] = useState(normalizeGender(user.gender))
  const [birthdate, setBirthdate] = useState(user.birthdate ? String(user.birthdate).slice(0,10) : '')
  const [birthdateText, setBirthdateText] = useState(user.birthdate ? formatIsoToDdMmYyyy(user.birthdate) : '')
  const [phone, setPhone] = useState(user.phone || '')
  const [role, setRole] = useState(user.role)
  const ref = useRef(null)

  function toIsoFromText(s){
    const m = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(s || '')
    return m ? `${m[3]}-${m[2]}-${m[1]}` : ''
  }
  function toTextFromIso(iso){
    if (!iso) return ''
    try {
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ''
      const day = String(date.getDate()).padStart(2, '0')
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const year = date.getFullYear()
      return `${day}/${month}/${year}`
    } catch (_err) {
      return ''
    }
  }

  async function save(){
    // Chỉ yêu cầu email hợp lệ nếu không phải học sinh/phụ huynh
    if (role !== 'STUDENT' && role !== 'PARENT' && !/^([^\s@]+)@([^\s@]+)\.[^\s@]{2,}$/.test(email)) {
      return alert('Email không hợp lệ (phải có tên miền)')
    }
    if (!username.trim()) return alert('Nhập họ và tên')
    if (!role) return alert('Chọn quyền')
    if (!gender) return alert('Chọn giới tính')
    if (phone && !/^\d{10}$/.test(phone)) return alert('Số điện thoại phải đủ 10 số')
    const isoBirth = birthdate || toIsoFromText(birthdateText)
    if (!isoBirth) return alert('Chọn ngày sinh (dd/mm/yyyy)')

    if (!confirm('Xác nhận: chỉnh sửa thông tin')) return

    await axios.put(`/api/admin/users/${user.id}`, { email, username, role, phone, gender: normalizeGender(gender) || null, birthdate: isoBirth })
    setEditing(false)
    onUpdated && onUpdated()
  }

  async function remove(){
    if (!confirm('Xác nhận xóa tài khoản này?')) return
    await axios.delete(`/api/admin/users/${user.id}`)
    onDeleted && onDeleted()
  }

  if (!editing) {
    return (
      <tr>
        <td>{user.id}</td>
        <td>{user.username}</td>
        <td>{renderGender(user.gender)}</td>
        <td>{formatIsoToDdMmYyyy(user.birthdate)}</td>
        <td>{user.email}</td>
        <td>{user.phone}</td>
        <td>
          <button className="icon-btn" onClick={()=>setEditing(true)} title="Chỉnh sửa">✏️</button>
          <button className="icon-btn" onClick={remove} title="Xóa" style={{marginLeft:8}}>🗑️</button>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td>{user.id}</td>
      <td><input className="input" value={username} onChange={e=>setUsername(e.target.value)} /></td>
      <td>
        <select className="input" value={gender} onChange={e=>setGender(e.target.value)}>
          <option value="" disabled>Giới tính</option>
          <option value="MALE">Nam</option>
          <option value="FEMALE">Nữ</option>
        </select>
      </td>
      <td>
        <div className="row" style={{gap:8}}>
          <input className="input" placeholder="dd/mm/yyyy" value={birthdateText || toTextFromIso(birthdate)} onChange={e=>setBirthdateText(e.target.value)} />
          <input ref={ref} type="date" style={{position:'absolute',opacity:0,width:0,height:0,pointerEvents:'none'}} value={birthdate} onChange={e=>setBirthdate(e.target.value)} />
          <button type="button" className="btn secondary" onClick={()=>ref.current && (ref.current.showPicker? ref.current.showPicker() : ref.current.click())}>Chọn</button>
        </div>
      </td>
      <td><input className="input" value={email} onChange={e=>setEmail(e.target.value)} placeholder={(role === 'STUDENT' || role === 'PARENT') ? 'Email (không bắt buộc)' : 'Email'} /></td>
      <td><input className="input" value={phone} onChange={e=>setPhone(e.target.value)} /></td>
      <td>
        <button className="btn" onClick={save}>Lưu</button>
        <button className="btn secondary" onClick={()=>setEditing(false)} style={{marginLeft:8}}>Hủy</button>
      </td>
    </tr>
  )
}

function TableWithPaging({ rows, searchQuery, sortKey, sortDir, pageSize, currentPage, setCurrentPage, activeRole, onReload, filterGender }){
  const q = (searchQuery || '').toLowerCase().trim()
  const filtered = q ? rows.filter(u =>
    (u.username || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q)
  ) : rows
  const genderFiltered = filterGender ? filtered.filter(u => normalizeGender(u.gender) === filterGender) : filtered
  const sorted = [...genderFiltered].sort((a,b)=>{
    const dir = sortDir === 'desc' ? -1 : 1
    if (sortKey === 'username'){
      const av = (a.username || '').toLowerCase()
      const bv = (b.username || '').toLowerCase()
      if (av < bv) return -1*dir; if (av > bv) return 1*dir; return 0
    }
    const av = Number(a.id) || 0
    const bv = Number(b.id) || 0
    return (av - bv) * dir
  })
  const total = sorted.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(currentPage, totalPages)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageRows = sorted.slice(start, end)

  return (
    <>
      <div className="table-responsive">
        <table>
          <thead><tr><th>ID</th><th>Họ và tên</th><th>Giới tính</th><th>Ngày sinh</th><th>Email</th><th>Phone</th><th></th></tr></thead>
          <tbody>
            {pageRows.map(u => (
              <EditableRow key={u.id} user={u} onUpdated={onReload} onDeleted={onReload} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="row" style={{justifyContent:'space-between', marginTop:12}}>
        <div>{total} kết quả • Trang {page}/{totalPages}</div>
        <div className="row">
          <button className="btn secondary" onClick={()=> setCurrentPage(Math.max(1, page-1))} disabled={page<=1}>Trước</button>
          <button className="btn secondary" onClick={()=> setCurrentPage(Math.min(totalPages, page+1))} disabled={page>=totalPages} style={{marginLeft:8}}>Sau</button>
        </div>
      </div>
    </>
  )
}


