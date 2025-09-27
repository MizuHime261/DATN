import { useEffect, useState } from 'react'
import axios from 'axios'

export default function ParentInvoices(){
  const [studentId, setStudentId] = useState('')
  const [children, setChildren] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [items, setItems] = useState([])
  const [paying, setPaying] = useState(false)
  const [amount, setAmount] = useState('')
  const [msg, setMsg] = useState('')
  const [bank, setBank] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())

  async function load(){
    if(!studentId) return
    setLoading(true)
    try{
      const { data } = await axios.get(`/api/parent/children/${studentId}/invoices`)
      setRows(data)
    } finally { setLoading(false) }
  }

  useEffect(()=>{ (async()=>{
    try{ const { data } = await axios.get('/api/parent/children'); setChildren(data||[]) }catch(_e){}
  })() }, [])

  const totalSelected = Array.from(selectedIds).reduce((sum, id)=>{
    const inv = rows.find(r=> String(r.id)===String(id)); return sum + (inv? Number(inv.total_cents||0) : 0)
  }, 0)
  const qrUrl = `https://qr.sepay.vn/img?bank=MBBank&acc=0090123062002&template=&amount=${totalSelected}&des=${encodeURIComponent('Thanh toan hoc phi HS '+(children.find(c=>String(c.id)===String(studentId))?.username||'') )}`

  async function openInvoice(inv){
    setSelected(inv); setItems([]); setMsg('')
    try{
      const { data } = await axios.get(`/api/parent/children/${studentId}/invoices/${inv.id}/items`)
      setItems(data)
    }catch(_e){ setItems([]) }
  }

  async function pay(){
    if (!selected) return
    setPaying(true); setMsg('')
    try{
      const cents = Math.max(0, Math.floor(Number(amount||0)))
      const { data } = await axios.post(`/api/parent/invoices/${selected.id}/pay`, { amount_cents: cents, method: 'TRANSFER' })
      setMsg(`Thanh toán thành công ${data.paid_cents}đ, trạng thái: ${data.new_status}`)
      await load(); await openInvoice(selected)
    }catch(e){ setMsg(e?.response?.data?.error || 'Thanh toán thất bại') }
    finally{ setPaying(false) }
  }

  return (
    <div className="card">
      <h3>Thanh toán học phí (Phụ huynh)</h3>
      <div className="row mt16" style={{alignItems:'center'}}>
        <select className="input" style={{width:360}} value={studentId} onChange={e=>{ setStudentId(e.target.value); setRows([]); setSelected(null); setSelectedIds(new Set()); setMsg('') }}>
          <option value="">Chọn học sinh</option>
          {children.map(ch => (
            <option key={ch.id} value={ch.id}>{`${ch.username || 'Học sinh'} - ${ch.email || ch.id}`}</option>
          ))}
        </select>
        <button className="btn" onClick={load} disabled={!studentId}>Tải hóa đơn</button>
      </div>
      <div className="row mt16" style={{justifyContent:'space-between', flexWrap:'wrap'}}>
        <select className="input" style={{width:240}} value={bank} onChange={e=>setBank(e.target.value)}>
          <option value="">Chọn ngân hàng</option>
          {['Vietcombank','VietinBank','BIDV','Techcombank','MBBank','VPBank','Agribank'].map(b=> (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
        <button className="btn" onClick={async()=>{
          setMsg('')
          let paid = 0
          for (const inv of rows){
            if (selectedIds.has(String(inv.id))){
              try{ const { data } = await axios.post(`/api/parent/invoices/${inv.id}/pay`, { amount_cents: inv.total_cents, method:'TRANSFER' }); paid += data.paid_cents||0 }catch(_e){}
            }
          }
          setMsg(paid>0? `Đã gửi thanh toán tổng ${paid}đ` : 'Chưa chọn hóa đơn để thanh toán')
          await load()
        }}>Thực hiện thanh toán</button>
      </div>
      {msg && <div className="mt16 input-help" style={{color:'#0b3a86'}}>{msg}</div>}
      {loading? 'Đang tải...' : (
        <div className="mt16">
          {rows.length===0? 'Không có dữ liệu' : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr><th>STT</th><th>Nội dung</th><th>Số tiền</th><th>Ghi chú</th><th></th></tr>
                </thead>
              <tbody>
                {rows.map((r,idx)=> {
                  const checked = selectedIds.has(String(r.id))
                  return (
                    <tr key={r.id}>
                      <td>{idx+1}</td>
                      <td>Hóa đơn #{r.id} ({r.billing_period_start} → {r.billing_period_end})</td>
                      <td>{r.total_cents}</td>
                      <td>{r.status}</td>
                      <td>
                        <input type="checkbox" checked={checked} onChange={e=>{
                          setSelectedIds(prev=>{ const n=new Set(prev); const k=String(r.id); if (e.target.checked) n.add(k); else n.delete(k); return n })
                        }} />
                        <button className="btn secondary" style={{marginLeft:8}} onClick={()=>openInvoice(r)}>Chi tiết</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <div className="row mt16" style={{alignItems:'center', gap:16}}>
        <div>Tổng tiền đã chọn: {totalSelected} đ</div>
        {totalSelected>0 && (
          <img alt="QR thanh toán" src={qrUrl} style={{height:120}} />
        )}
      </div>
      {selected && (
        <div className="card mt16">
          <h3 style={{marginTop:0}}>Chi tiết hóa đơn {selected.id}</h3>
          <div className="table-responsive">
            <table>
              <thead><tr><th>Loại</th><th>Mô tả</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id}><td>{it.item_type}</td><td>{it.description}</td><td>{it.quantity}</td><td>{it.unit_price_cents}</td><td>{it.total_cents}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="row mt16">
            <input className="input" placeholder="Số tiền muốn thanh toán (đ)" value={amount} onChange={e=>setAmount(e.target.value)} />
            <button className="btn" onClick={pay} disabled={paying}>Thanh toán</button>
          </div>
        </div>
      )}
    </div>
  )
}


