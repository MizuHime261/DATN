import { useEffect, useRef, useState } from 'react'
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
  const startRef = useRef(null)
  const endRef = useRef(null)

  function toIsoFromText(s){
    const m = /^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/.exec(s || '')
    return m ? `${m[3]}-${m[2]}-${m[1]}` : ''
  }
  function toTextFromIso(iso){
    if (!iso) return ''
    const [y,m,d] = String(iso).split('-')
    if (!y||!m||!d) return ''
    return `${d}/${m}/${y}`
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
    <div className="row" style={{alignItems:'flex-start'}}>
      {/* Left column: 1/3 width - Tạo theo Khối */}
      <div style={{flex:3}}>
        <div className="card">
          <h3 style={{marginTop:0}}>Tạo hóa đơn theo Khối</h3>
          <div className="row mt16" style={{alignItems:'stretch', gap:12}}>
            <div style={{flex:1}}>
              <div className="input-help" style={{margin:'0 0 6px 2px'}}>Khối</div>
              <select className="input" value={batch.grade_id} onChange={e=>setBatch(b=>({...b,grade_id:e.target.value}))}>
                <option value="">Chọn Khối</option>
                {grades.map(g=>{ const lv = levels.find(l=> String(l.id)===String(g.level_id)); return <option key={g.id} value={g.id}>{`${lv? lv.name:'Cấp ?'} - Khối ${g.grade_number}`}</option> })}
              </select>
            </div>
            <div style={{flex:1}}>
              <div className="input-help" style={{margin:'0 0 6px 2px'}}>Thời gian nộp từ ngày (dd/mm/yyyy)</div>
              <div className="row" style={{gap:8, alignItems:'stretch'}}>
                <input className="input" placeholder="dd/mm/yyyy" value={batch.start} onChange={e=>setBatch(b=>({...b,start:e.target.value}))} />
                <input ref={startRef} type="date" style={{position:'absolute',opacity:0,width:0,height:0,pointerEvents:'none'}} value={toIsoFromText(batch.start) || ''} onChange={e=>setBatch(b=>({...b,start: toTextFromIso(e.target.value)}))} />
                <button type="button" className="btn secondary" onClick={()=>startRef.current && (startRef.current.showPicker? startRef.current.showPicker() : startRef.current.click())}>Chọn</button>
              </div>
            </div>
            <div style={{flex:1}}>
              <div className="input-help" style={{margin:'0 0 6px 2px'}}>Đến ngày (dd/mm/yyyy)</div>
              <div className="row" style={{gap:8, alignItems:'stretch'}}>
                <input className="input" placeholder="dd/mm/yyyy" value={batch.end} onChange={e=>setBatch(b=>({...b,end:e.target.value}))} />
                <input ref={endRef} type="date" style={{position:'absolute',opacity:0,width:0,height:0,pointerEvents:'none'}} value={toIsoFromText(batch.end) || ''} onChange={e=>setBatch(b=>({...b,end: toTextFromIso(e.target.value)}))} />
                <button type="button" className="btn secondary" onClick={()=>endRef.current && (endRef.current.showPicker? endRef.current.showPicker() : endRef.current.click())}>Chọn</button>
              </div>
            </div>
          </div>
          <div className="mt16">
            <table>
              <thead><tr><th>Mô tả</th><th>Loại</th><th>SL</th><th>Đơn giá</th><th></th></tr></thead>
              <tbody>
                {batch.items.map((it,idx)=>(
                  <tr key={idx}>
                    <td><input className="input" value={it.description} onChange={e=>setBatch(b=>{ const s=[...b.items]; s[idx]={...s[idx],description:e.target.value}; return {...b,items:s} })} /></td>
                    <td>
                      <select className="input" value={it.item_type} onChange={e=>setBatch(b=>{ const s=[...b.items]; s[idx]={...s[idx],item_type:e.target.value}; return {...b,items:s} })}>
                        <option>TUITION</option><option>MEAL</option><option>FEE</option><option>DISCOUNT</option><option>OTHER</option>
                      </select>
                    </td>
                    <td><input className="input" value={it.quantity} onChange={e=>setBatch(b=>{ const s=[...b.items]; s[idx]={...s[idx],quantity:e.target.value}; return {...b,items:s} })} /></td>
                    <td><input className="input" value={it.unit_price_cents} onChange={e=>setBatch(b=>{ const s=[...b.items]; s[idx]={...s[idx],unit_price_cents:e.target.value}; return {...b,items:s} })} /></td>
                    <td><button className="btn secondary" onClick={()=>setBatch(b=>({ ...b, items: b.items.filter((_,i)=>i!==idx) }))}>Xóa</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="btn mt16" onClick={()=>setBatch(b=>({ ...b, items:[...b.items, { item_type:'FEE', description:'Khoản khác', quantity:'1', unit_price_cents:'' }] }))}>Thêm dòng</button>
          </div>
          <div className="row mt16">
            <button className="btn" onClick={async()=>{
              const payload = {
                grade_id: Number(batch.grade_id),
                billing_period_start: toIsoFromText(batch.start) || batch.start,
                billing_period_end: toIsoFromText(batch.end) || batch.end,
                items: batch.items.map(it=>({ item_type:it.item_type, description:it.description, quantity:Number(it.quantity||1), unit_price_cents:Number(it.unit_price_cents||0) })),
                replace: true
              }
              await axios.post('/api/staff/invoices/batch-by-grade', payload)
              await load()
              alert('Đã tạo hóa đơn theo khối')
            }}>Tạo hóa đơn</button>
          </div>
        </div>
      </div>

      {/* Right column: 2/3 width - Danh sách hóa đơn */}
      <div style={{flex:4, marginLeft:12}}>
        <div className="card">
      <h3>Danh sách hóa đơn</h3>
          <div className="row mt16" style={{justifyContent:'flex-start'}}>
            <input className="input" style={{flex:1}} placeholder="Tìm theo tên hoặc trạng thái" value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))} />
            <div style={{width:12}} />
            <button className="btn" onClick={load}>Tìm kiếm</button>
          </div>
      {loading? 'Đang tải...' : (
        <div className="mt16">
          {rows.length===0? 'Không có dữ liệu' : (
            <table>
              <thead>
                <tr><th>Mã</th><th>Học sinh</th><th>Trạng thái</th><th>Tổng tiền</th></tr>
              </thead>
              <tbody>
                {rows.map(r=> (
                  <tr key={r.id} onClick={()=>openInvoice(r.id)} style={{cursor:'pointer'}}>
                    <td>{r.id}</td>
                    <td>{r.student_name}</td>
                    <td>{r.status}</td>
                    <td>{r.total_cents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {detail && (
        <div className="mt24">
          <h4>Hóa đơn {detail.invoice.id}</h4>
          <div>Trạng thái: {detail.invoice.status}</div>
          <div className="mt16">
            <h5>Khoản mục</h5>
            <table>
              <thead><tr><th>Mô tả</th><th>Loại</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {detail.items.map(it => (<tr key={it.id}><td>{it.description}</td><td>{it.item_type}</td><td>{it.quantity}</td><td>{it.unit_price_cents}</td><td>{it.total_cents}</td></tr>))}
              </tbody>
            </table>
          </div>
          <div className="row mt16">
            <input className="input" placeholder="Mô tả" value={item.description} onChange={e=>setItem(i=>({...i,description:e.target.value}))} />
            <input className="input" placeholder="SL" value={item.quantity} onChange={e=>setItem(i=>({...i,quantity:e.target.value}))} />
            <input className="input" placeholder="Đơn giá" value={item.unit_price_cents} onChange={e=>setItem(i=>({...i,unit_price_cents:e.target.value}))} />
            <select className="input" value={item.item_type} onChange={e=>setItem(i=>({...i,item_type:e.target.value}))}>
              <option>TUITION</option><option>MEAL</option><option>FEE</option><option>DISCOUNT</option><option>OTHER</option>
            </select>
            <button className="btn" onClick={addItem}>Thêm mục</button>
          </div>
          <div className="row mt16">
            <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
              <option>ISSUED</option>
              <option>PARTIALLY_PAID</option>
              <option>PAID</option>
              <option>VOID</option>
            </select>
            <button className="btn secondary" onClick={updateStatus}>Cập nhật trạng thái</button>
          </div>
        </div>
      )}
        </div>
      </div>

    </div>
  )
}


