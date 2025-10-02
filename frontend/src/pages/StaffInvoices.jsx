import { useEffect, useState } from 'react'
import axios from 'axios'

export default function StaffInvoices(){
  const [rows, setRows] = useState([])
  const [filters, setFilters] = useState({ student_user_id:'', status:'', school_id:'' })
  const [detail, setDetail] = useState(null)
  const [item, setItem] = useState({ item_type:'OTHER', description:'', quantity:'1', unit_price_cents:'' })
  const [status, setStatus] = useState('ISSUED')
  const [loading, setLoading] = useState(false)
  const [grades, setGrades] = useState([])
  const [levels, setLevels] = useState([])
  const [batch, setBatch] = useState({ grade_id:'', start:'', end:'', items:[{ item_type:'TUITION', description:'Học phí', quantity:'1', unit_price_cents:'' }] })

  function toIsoFromText(s){
    const m = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(s || '')
    return m ? `${m[3]}-${m[2]}-${m[1]}` : ''
  }
  function toTextFromIso(iso){
    if (!iso) return ''
    try {
      // Handle both YYYY-MM-DD and full ISO date formats
      const dateStr = iso.includes('T') ? iso.split('T')[0] : iso
      const date = new Date(dateStr + 'T00:00:00.000Z')
      if (Number.isNaN(date.getTime())) return ''
      
      // Use UTC methods to avoid timezone issues
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
    try{
      const { data } = await axios.get('/api/staff/invoices', { params: { ...filters } })
      setRows(data)
    }finally{ setLoading(false) }
  }
  useEffect(()=>{ load() },[])
  useEffect(()=>{ (async()=>{ try{ const [g,l] = await Promise.all([axios.get('/api/staff/grades'), axios.get('/api/staff/levels')]); setGrades(g.data||[]); setLevels(l.data||[]) }catch(_e){} })() }, [])

  async function openInvoice(id){
    const { data } = await axios.get(`/api/staff/invoices/${id}`)
    setDetail(data)
  }

  async function addItem(){
    await axios.post(`/api/staff/invoices/${detail.invoice.id}/items`, {
      ...item,
      quantity: Number(item.quantity||1),
      unit_price_cents: Number(item.unit_price_cents||0)
    })
    await openInvoice(detail.invoice.id); await load()
  }

  async function updateStatus(){
    await axios.patch(`/api/staff/invoices/${detail.invoice.id}`, { status })
    await openInvoice(detail.invoice.id); await load()
  }

  return (
    <div className="staff-invoices-page">
      {/* Top Section - Invoice Creation Form */}
      <div className="card mb-24">
        <div className="invoice-form-header">
          <h2 className="invoice-form-title">Tạo hóa đơn theo Khối</h2>
          <p className="invoice-form-subtitle">Tạo hóa đơn hàng loạt cho tất cả học sinh trong khối được chọn</p>
        </div>
        
        <div className="invoice-form-grid">
          <div className="form-section">
            <h4 className="section-title">Thông tin cơ bản</h4>
            <div className="form-row">
              <div className="form-field">
                <label className="field-label">Khối học</label>
                <select className="input" value={batch.grade_id} onChange={e=>setBatch(b=>({...b,grade_id:e.target.value}))}>
                  <option value="">Chọn Khối</option>
                  {grades.map(g=>{ const lv = levels.find(l=> String(l.id)===String(g.level_id)); return <option key={g.id} value={g.id}>{`${lv? lv.name:'Cấp ?'} - Khối ${g.grade_number}`}</option> })}
                </select>
              </div>
              <div className="form-field">
                <label className="field-label">Từ ngày</label>
                <div className="date-input-wrapper">
                  <input 
                    type="date" 
                    className="input date-input" 
                    value={toIsoFromText(batch.start) || ''} 
                    onChange={e=>setBatch(b=>({...b,start: toTextFromIso(e.target.value)}))}
                  />
                  <div className="date-display">
                    {batch.start || 'Chọn ngày bắt đầu'}
                  </div>
                </div>
              </div>
              <div className="form-field">
                <label className="field-label">Đến ngày</label>
                <div className="date-input-wrapper">
                  <input 
                    type="date" 
                    className="input date-input" 
                    value={toIsoFromText(batch.end) || ''} 
                    onChange={e=>setBatch(b=>({...b,end: toTextFromIso(e.target.value)}))}
                  />
                  <div className="date-display">
                    {batch.end || 'Chọn ngày kết thúc'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="section-header">
              <h4 className="section-title">Khoản mục hóa đơn</h4>
              <button className="btn secondary" onClick={()=>setBatch(b=>({ ...b, items:[...b.items, { item_type:'FEE', description:'Khoản khác', quantity:'1', unit_price_cents:'' }] }))}>
                + Thêm khoản mục
              </button>
            </div>
            
            <div className="invoice-items-table">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Mô tả</th>
                    <th>Loại khoản</th>
                    <th>Số lượng</th>
                    <th>Đơn giá (VNĐ)</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.items.map((it,idx)=>(
                    <tr key={idx}>
                      <td>
                        <input 
                          className="input table-input" 
                          value={it.description} 
                          onChange={e=>setBatch(b=>{ const s=[...b.items]; s[idx]={...s[idx],description:e.target.value}; return {...b,items:s} })} 
                          placeholder="Nhập mô tả"
                        />
                      </td>
                      <td>
                        <select 
                          className="input table-input" 
                          value={it.item_type} 
                          onChange={e=>setBatch(b=>{ const s=[...b.items]; s[idx]={...s[idx],item_type:e.target.value}; return {...b,items:s} })}
                        >
                          <option value="TUITION">Học phí</option>
                          <option value="MEAL">Tiền ăn</option>
                          <option value="FEE">Phí khác</option>
                          <option value="DISCOUNT">Giảm giá</option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </td>
                      <td>
                        <input 
                          className="input table-input" 
                          type="number" 
                          value={it.quantity} 
                          onChange={e=>setBatch(b=>{ const s=[...b.items]; s[idx]={...s[idx],quantity:e.target.value}; return {...b,items:s} })} 
                          placeholder="1"
                        />
                      </td>
                      <td>
                        <input 
                          className="input table-input" 
                          type="number" 
                          value={it.unit_price_cents} 
                          onChange={e=>setBatch(b=>{ const s=[...b.items]; s[idx]={...s[idx],unit_price_cents:e.target.value}; return {...b,items:s} })} 
                          placeholder="0"
                        />
                      </td>
                      <td>
                        <button 
                          className="btn-delete" 
                          onClick={()=>setBatch(b=>({ ...b, items: b.items.filter((_,i)=>i!==idx) }))}
                          title="Xóa khoản mục"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button 
            className="btn btn-primary btn-create-invoice" 
            onClick={async()=>{
              if (!batch.grade_id || batch.grade_id === '') {
                alert('Vui lòng chọn khối học');
                return;
              }
              
              // Validate grade_id is a valid number
              const gradeIdNum = Number(batch.grade_id);
              if (isNaN(gradeIdNum) || gradeIdNum <= 0) {
                alert('Khối học không hợp lệ');
                return;
              }
              if (!batch.start || !batch.end) {
                alert('Vui lòng nhập thời gian nộp');
                return;
              }
              if (batch.items.length === 0) {
                alert('Vui lòng thêm ít nhất một khoản mục');
                return;
              }
              
              // Validate inputs
              const startDate = batch.start;
              const endDate = batch.end;
              
              if (!startDate || !endDate) {
                alert('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
                return;
              }
              
              // Convert dates to ISO format if they're in dd/mm/yyyy format
              let isoStartDate = startDate;
              let isoEndDate = endDate;
              
              // If the date is in dd/mm/yyyy format, convert to ISO
              if (startDate.includes('/')) {
                isoStartDate = toIsoFromText(startDate);
              }
              if (endDate.includes('/')) {
                isoEndDate = toIsoFromText(endDate);
              }
              
              // Validate converted dates
              if (!isoStartDate || !isoEndDate) {
                alert('Định dạng ngày không hợp lệ');
                return;
              }
              
              const payload = {
                grade_id: Number(batch.grade_id),
                billing_period_start: isoStartDate,
                billing_period_end: isoEndDate,
                items: batch.items.filter(it => it.description && it.unit_price_cents).map(it=>({ 
                  item_type: it.item_type || 'OTHER', 
                  description: it.description.trim(), 
                  quantity: Number(it.quantity) || 1, 
                  unit_price_cents: Number(it.unit_price_cents) || 0 
                })),
                replace: true
              }
              
              // Final validation
              if (payload.items.length === 0) {
                alert('Vui lòng thêm ít nhất một khoản mục hợp lệ');
                return;
              }
              
              console.log('Payload being sent:', payload); // Debug log
              console.log('Grade ID type:', typeof payload.grade_id, payload.grade_id);
              console.log('Dates:', payload.billing_period_start, payload.billing_period_end);
              console.log('Items:', payload.items);
              
              try {
                const response = await axios.post('/api/staff/invoices/batch-by-grade', payload)
                await load()
                
                const result = response.data
                if (result.created || result.updated) {
                  alert(`Đã tạo hóa đơn thành công!\nTạo mới: ${result.created || 0} hóa đơn\nCập nhật: ${result.updated || 0} hóa đơn\nTổng học sinh: ${result.students || 0}`)
                } else {
                  alert('Đã tạo hóa đơn theo khối thành công!')
                }
                
                // Reset form
                setBatch({ 
                  grade_id:'', 
                  start:'', 
                  end:'', 
                  items:[{ item_type:'TUITION', description:'Học phí', quantity:'1', unit_price_cents:'' }] 
                })
              } catch (error) {
                console.error('Error creating invoices:', error)
                console.error('Error response data:', error.response?.data)
                console.error('Error response status:', error.response?.status)
                
                let errorMessage = 'Có lỗi xảy ra khi tạo hóa đơn'
                
                if (error.response) {
                  // Server responded with error status
                  const status = error.response.status
                  const data = error.response.data
                  
                  if (status === 400) {
                    if (data.error === 'Grade not found') {
                      errorMessage = 'Không tìm thấy khối học được chọn'
                    } else if (data.error === 'No active students found in this grade') {
                      errorMessage = 'Không có học sinh nào đang học trong khối này'
                    } else if (data.error === 'grade_id, period and items required') {
                      errorMessage = 'Vui lòng điền đầy đủ thông tin: khối học, thời gian và khoản mục'
                    } else {
                      errorMessage = `Lỗi dữ liệu không hợp lệ: ${data.error || 'Vui lòng kiểm tra lại thông tin'}`
                    }
                  } else if (status === 401) {
                    errorMessage = 'Bạn không có quyền thực hiện thao tác này'
                  } else if (status === 500) {
                    errorMessage = 'Lỗi server, vui lòng thử lại sau'
                  } else {
                    errorMessage = `Lỗi ${status}: ${data.error || 'Không xác định'}`
                  }
                } else if (error.request) {
                  errorMessage = 'Không thể kết nối đến server'
                } else {
                  errorMessage = `Lỗi: ${error.message}`
                }
                
                alert(errorMessage)
              }
            }}
          >
            🧾 Tạo hóa đơn theo khối
          </button>
        </div>
      </div>

      {/* Bottom Section - Invoice List */}
      <div className="card">
        <div className="invoice-list-header">
          <h3 className="invoice-list-title">Danh sách hóa đơn</h3>
          <div className="invoice-search-bar">
            <input 
              className="input search-input" 
              placeholder="Tìm kiếm theo tên học sinh hoặc trạng thái..." 
              value={filters.status} 
              onChange={e=>setFilters(f=>({...f,status:e.target.value}))} 
            />
            <button className="btn btn-search" onClick={load}>
              🔍 Tìm kiếm
            </button>
          </div>
        </div>

        <div className="invoice-list-content">
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Đang tải danh sách hóa đơn...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h4>Chưa có hóa đơn nào</h4>
              <p>Tạo hóa đơn mới bằng form phía trên</p>
            </div>
          ) : (
            <div className="invoice-table-wrapper">
              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>Mã HĐ</th>
                    <th>Học sinh</th>
                    <th>Trạng thái</th>
                    <th>Tổng tiền</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r=> (
                    <tr key={r.id} className="invoice-row">
                      <td className="invoice-id">#{r.id}</td>
                      <td className="student-name">{r.student_name}</td>
                      <td>
                        <span className={`status-badge status-${r.status.toLowerCase()}`}>
                          {r.status === 'DRAFT' ? 'Nháp' : 
                           r.status === 'ISSUED' ? 'Đã phát hành' :
                           r.status === 'PARTIALLY_PAID' ? 'Thanh toán một phần' :
                           r.status === 'PAID' ? 'Đã thanh toán' : 
                           r.status === 'VOID' ? 'Đã hủy' : r.status}
                        </span>
                      </td>
                      <td className="invoice-amount">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.total_cents)}
                      </td>
                      <td className="invoice-date">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('vi-VN') : '-'}
                      </td>
                      <td>
                        <button 
                          className="btn btn-view" 
                          onClick={()=>openInvoice(r.id)}
                          title="Xem chi tiết"
                        >
                          👁️ Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invoice Detail Modal/Section */}
        {detail && (
          <div className="invoice-detail-section">
            <div className="detail-header">
              <h4 className="detail-title">Chi tiết hóa đơn #{detail.invoice.id}</h4>
              <button 
                className="btn-close" 
                onClick={()=>setDetail(null)}
                title="Đóng"
              >
                ✕
              </button>
            </div>
            
            <div className="detail-info">
              <div className="info-item">
                <span className="info-label">Trạng thái:</span>
                <span className={`status-badge status-${detail.invoice.status.toLowerCase()}`}>
                  {detail.invoice.status === 'DRAFT' ? 'Nháp' : 
                   detail.invoice.status === 'ISSUED' ? 'Đã phát hành' :
                   detail.invoice.status === 'PARTIALLY_PAID' ? 'Thanh toán một phần' :
                   detail.invoice.status === 'PAID' ? 'Đã thanh toán' : 
                   detail.invoice.status === 'VOID' ? 'Đã hủy' : detail.invoice.status}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Tổng tiền:</span>
                <span className="info-value">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(detail.invoice.total_cents)}
                </span>
              </div>
            </div>

            <div className="detail-items">
              <h5>Khoản mục</h5>
              <table className="detail-items-table">
                <thead>
                  <tr>
                    <th>Mô tả</th>
                    <th>Loại</th>
                    <th>SL</th>
                    <th>Đơn giá</th>
                    <th>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map(it => (
                    <tr key={it.id}>
                      <td>{it.description}</td>
                      <td>
                        <span className={`item-type-badge type-${it.item_type.toLowerCase()}`}>
                          {it.item_type === 'TUITION' ? 'Học phí' :
                           it.item_type === 'MEAL' ? 'Tiền ăn' :
                           it.item_type === 'FEE' ? 'Phí khác' :
                           it.item_type === 'DISCOUNT' ? 'Giảm giá' : 'Khác'}
                        </span>
                      </td>
                      <td>{it.quantity}</td>
                      <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(it.unit_price_cents)}</td>
                      <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(it.total_cents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="detail-actions">
              <div className="add-item-section">
                <h5>Thêm khoản mục mới</h5>
                <div className="add-item-form">
                  <input 
                    className="input" 
                    placeholder="Mô tả" 
                    value={item.description} 
                    onChange={e=>setItem(i=>({...i,description:e.target.value}))} 
                  />
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="Số lượng" 
                    value={item.quantity} 
                    onChange={e=>setItem(i=>({...i,quantity:e.target.value}))} 
                  />
                  <input 
                    className="input" 
                    type="number" 
                    placeholder="Đơn giá" 
                    value={item.unit_price_cents} 
                    onChange={e=>setItem(i=>({...i,unit_price_cents:e.target.value}))} 
                  />
                  <select 
                    className="input" 
                    value={item.item_type} 
                    onChange={e=>setItem(i=>({...i,item_type:e.target.value}))}
                  >
                    <option value="TUITION">Học phí</option>
                    <option value="MEAL">Tiền ăn</option>
                    <option value="FEE">Phí khác</option>
                    <option value="DISCOUNT">Giảm giá</option>
                    <option value="OTHER">Khác</option>
                  </select>
                  <button className="btn" onClick={addItem}>+ Thêm</button>
                </div>
              </div>

              <div className="status-update-section">
                <h5>Cập nhật trạng thái</h5>
                <div className="status-update-form">
                  <select 
                    className="input" 
                    value={status} 
                    onChange={e=>setStatus(e.target.value)}
                  >
                    <option value="DRAFT">Nháp</option>
                    <option value="ISSUED">Đã phát hành</option>
                    <option value="PARTIALLY_PAID">Thanh toán một phần</option>
                    <option value="PAID">Đã thanh toán</option>
                    <option value="VOID">Đã hủy</option>
                  </select>
                  <button className="btn secondary" onClick={updateStatus}>Cập nhật</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


