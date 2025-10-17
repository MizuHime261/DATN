import { useEffect, useState, useRef } from 'react'
import axios from 'axios'

export default function StaffMeals(){
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ 
    level_id: '1', 
    plan_date: '', 
    meal_type: 'LUNCH', 
    title: '' 
  })
  const [filters, setFilters] = useState({ level_id: '', date_from: '', date_to: '', meal_type: '' })
  const [msg, setMsg] = useState('')
  const [msgType, setMsgType] = useState('')
  const [loading, setLoading] = useState(false)
  const dateRef = useRef(null)

  // Date conversion functions
  function toIsoFromText(s){
    const m = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(s || '')
    return m ? `${m[3]}-${m[2]}-${m[1]}` : ''
  }
  
  function toTextFromIso(iso){
    if (!iso) return ''
    try {
      const dateStr = iso.includes('T') ? iso.split('T')[0] : iso
      const date = new Date(dateStr + 'T00:00:00.000Z')
      if (Number.isNaN(date.getTime())) return ''
      
      const day = String(date.getUTCDate()).padStart(2, '0')
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const year = date.getUTCFullYear()
      return `${day}/${month}/${year}`
    } catch (_err) {
      return ''
    }
  }

  async function load(){
    setLoading(true)
    try {
      const params = {}
      if (filters.level_id) params.level_id = filters.level_id
      
      const { data } = await axios.get('/api/staff/meal-plans', { params })
      
      // Filter on frontend if needed
      let filteredData = data
      if (filters.date_from) {
        filteredData = filteredData.filter(row => new Date(row.plan_date) >= new Date(filters.date_from))
      }
      if (filters.date_to) {
        filteredData = filteredData.filter(row => new Date(row.plan_date) <= new Date(filters.date_to))
      }
      if (filters.meal_type) {
        filteredData = filteredData.filter(row => row.meal_type === filters.meal_type)
      }
      
      setRows(filteredData)
    } catch (error) {
      showMessage('Lỗi khi tải dữ liệu', 'error')
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(()=>{ load() },[])

  function showMessage(message, type = 'success') {
    setMsg(message)
    setMsgType(type)
    setTimeout(() => {
      setMsg('')
      setMsgType('')
    }, 3000)
  }

  async function save(){
    if (!form.plan_date) {
      showMessage('Vui lòng chọn ngày', 'error')
      return
    }
    if (!form.title.trim()) {
      showMessage('Vui lòng nhập tên món ăn', 'error')
      return
    }
    // No price validation; price is handled in invoices

    try {
      const payload = {
        ...form,
        title: form.title.trim()
      }
      
      await axios.post('/api/staff/meal-plans', payload)
      showMessage('Lưu suất ăn thành công!', 'success')
      
      // Reset form
      setForm({ 
        level_id: '1', 
        plan_date: '', 
        meal_type: 'LUNCH', 
        title: '' 
      })
      
      await load()
    } catch (error) {
      showMessage('Lưu thất bại: ' + (error.response?.data?.error || 'Lỗi không xác định'), 'error')
    }
  }

  // Generate quick date options
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  return (
    <div className="staff-meals-page">
      {/* Top Section - Create Meal Plan */}
      <div className="card mb-24">
        <div className="meal-form-header">
          <h2 className="meal-form-title">Tạo thực đơn bán trú</h2>
          <p className="meal-form-subtitle">Lập kế hoạch bữa ăn cho học sinh bán trú</p>
        </div>

        <div className="meal-form-grid">
          <div className="form-section">
            <h4 className="section-title">Thông tin cơ bản</h4>
            <div className="form-row">
              <div className="form-field">
                <label className="field-label">Cấp học</label>
                <select 
                  className="input" 
                  value={form.level_id} 
                  onChange={e=>setForm(f=>({...f, level_id:e.target.value}))}
                >
                  <option value="1">Tiểu học</option>
                  <option value="2">THCS</option>
                  <option value="3">THPT</option>
                </select>
              </div>
              
              <div className="form-field">
                <label className="field-label">Ngày phục vụ</label>
                <div className="date-input-wrapper">
                  <input 
                    ref={dateRef}
                    type="date" 
                    className="input date-input" 
                    value={form.plan_date} 
                    onChange={e=>setForm(f=>({...f, plan_date: e.target.value}))}
                  />
                  <div className="date-display">
                    {form.plan_date ? toTextFromIso(form.plan_date) : 'Chọn ngày phục vụ'}
                  </div>
                </div>
                <div className="quick-date-buttons">
                  <button 
                    type="button" 
                    className="btn-quick-date"
                    onClick={() => setForm(f=>({...f, plan_date: today.toISOString().split('T')[0]}))}
                  >
                    Hôm nay
                  </button>
                  <button 
                    type="button" 
                    className="btn-quick-date"
                    onClick={() => setForm(f=>({...f, plan_date: tomorrow.toISOString().split('T')[0]}))}
                  >
                    Ngày mai
                  </button>
                </div>
              </div>

              <div className="form-field">
                <label className="field-label">Loại bữa ăn</label>
                <select 
                  className="input" 
                  value={form.meal_type} 
                  onChange={e=>setForm(f=>({...f, meal_type:e.target.value}))}
                >
                  <option value="BREAKFAST">🌅 Bữa sáng</option>
                  <option value="LUNCH">🍽️ Bữa trưa</option>
                  <option value="DINNER">🌙 Bữa tối</option>
                  <option value="SNACK">🍪 Bữa phụ</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h4 className="section-title">Chi tiết thực đơn</h4>
            <div className="form-row">
              <div className="form-field form-field-wide">
                <label className="field-label">Tên món ăn / Thực đơn</label>
                <input 
                  className="input" 
                  placeholder="VD: Cơm gà xối mỡ, canh chua cá lóc, rau muống luộc..." 
                  value={form.title} 
                  onChange={e=>setForm(f=>({...f, title:e.target.value}))} 
                />
              </div>
              
              {/* Giá tiền bỏ khỏi form; được tạo ở hóa đơn */}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button className="btn btn-primary btn-save-meal" onClick={save}>
            🍽️ Lưu thực đơn
          </button>
        </div>
        
        {msg && (
          <div className={`meal-message ${msgType === 'error' ? 'meal-message-error' : 'meal-message-success'}`}>
            {msg}
          </div>
        )}
      </div>

      {/* Bottom Section - Meal Plans List */}
      <div className="card">
            <div className="meal-list-header">
          <h3 className="meal-list-title">Danh sách thực đơn</h3>
          <div className="meal-filters">
            <select 
              className="input filter-input" 
              value={filters.level_id} 
              onChange={e=>setFilters(f=>({...f, level_id:e.target.value}))}
            >
              <option value="">Tất cả cấp học</option>
              <option value="1">Tiểu học</option>
              <option value="2">THCS</option>
              <option value="3">THPT</option>
            </select>
            <select 
              className="input filter-input" 
              value={filters.meal_type} 
              onChange={e=>setFilters(f=>({...f, meal_type:e.target.value}))}
            >
              <option value="">Tất cả bữa ăn</option>
              <option value="BREAKFAST">Bữa sáng</option>
              <option value="LUNCH">Bữa trưa</option>
              <option value="DINNER">Bữa tối</option>
              <option value="SNACK">Bữa phụ</option>
            </select>
            <input 
              type="date" 
              className="input filter-input" 
              placeholder="Từ ngày"
              value={filters.date_from}
              onChange={e=>setFilters(f=>({...f, date_from:e.target.value}))}
            />
            <input 
              type="date" 
              className="input filter-input" 
              placeholder="Đến ngày"
              value={filters.date_to}
              onChange={e=>setFilters(f=>({...f, date_to:e.target.value}))}
            />
            <button className="btn btn-search" onClick={load}>
              🔍 Lọc
            </button>
          </div>
        </div>

        <div className="meal-list-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải danh sách thực đơn...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🍽️</div>
              <h4>Chưa có thực đơn nào</h4>
              <p>Tạo thực đơn mới bằng form phía trên</p>
            </div>
          ) : (
            <div className="meal-table-wrapper">
              <table className="meal-table">
                <thead>
                  <tr>
                    <th>Ngày phục vụ</th>
                    <th>Bữa ăn</th>
                    <th>Thực đơn</th>
                    {/* Ẩn giá tiền; chỉ hiển thị cấp học */}
                    <th>Cấp học</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={`${r.level_id}-${r.plan_date}-${r.meal_type}`} className="meal-row">
                      <td className="meal-date">
                        {toTextFromIso(r.plan_date)}
                      </td>
                      <td>
                        <span className={`meal-type-badge meal-type-${r.meal_type.toLowerCase()}`}>
                          {r.meal_type === 'BREAKFAST' ? '🌅 Sáng' :
                           r.meal_type === 'LUNCH' ? '🍽️ Trưa' :
                           r.meal_type === 'DINNER' ? '🌙 Tối' :
                           r.meal_type === 'SNACK' ? '🍪 Phụ' : r.meal_type}
                        </span>
                      </td>
                      <td className="meal-title">{r.title}</td>
                      <td className="meal-school">Cấp {r.level_id}</td>
                      <td>
                        <button 
                          className="btn btn-edit" 
                          onClick={() => {
                            setForm({
                              level_id: r.level_id,
                              plan_date: r.plan_date,
                              meal_type: r.meal_type,
                              title: r.title,
                              
                            })
                          }}
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



