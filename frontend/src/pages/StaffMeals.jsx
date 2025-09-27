import { useEffect, useState } from 'react'
import axios from 'axios'

export default function StaffMeals(){
  const [schoolId, setSchoolId] = useState('')
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ school_id:'', plan_date:'', meal_type:'LUNCH', title:'', price_cents:'' })
  const [msg, setMsg] = useState('')

  async function load(){
    const { data } = await axios.get('/api/staff/meal-plans', { params: schoolId? { school_id: schoolId } : {} })
    setRows(data)
  }
  useEffect(()=>{ load() },[])

  async function save(){
    setMsg('')
    try{
      await axios.post('/api/staff/meal-plans', { ...form, price_cents: Number(form.price_cents||0) })
      setMsg('Lưu suất ăn thành công'); await load()
    }catch{ setMsg('Lưu thất bại') }
  }

  return (
    <div className="card">
      <h3>Quản lý suất ăn</h3>
      <div className="row mt16">
        <input className="input" placeholder="school_id lọc" value={schoolId} onChange={e=>setSchoolId(e.target.value)} />
        <button className="btn" onClick={load}>Tải</button>
      </div>
      <div className="row mt16">
        <input className="input" placeholder="school_id" value={form.school_id} onChange={e=>setForm(f=>({...f, school_id:e.target.value}))} />
        <input className="input" type="date" value={form.plan_date} onChange={e=>setForm(f=>({...f, plan_date:e.target.value}))} />
        <select className="input" value={form.meal_type} onChange={e=>setForm(f=>({...f, meal_type:e.target.value}))}><option>LUNCH</option></select>
      </div>
      <div className="row mt16">
        <input className="input" placeholder="Tên món" value={form.title} onChange={e=>setForm(f=>({...f, title:e.target.value}))} />
        <input className="input" placeholder="Giá (đ)" value={form.price_cents} onChange={e=>setForm(f=>({...f, price_cents:e.target.value}))} />
        <button className="btn" onClick={save}>Lưu</button>
      </div>
      {msg && <div className="mt16">{msg}</div>}
      <div className="mt16">
        {rows.length===0? 'Không có dữ liệu' : (
          <table>
            <thead><tr><th>Ngày</th><th>Loại</th><th>Tiêu đề</th><th>Giá</th></tr></thead>
            <tbody>
              {rows.map(r => (<tr key={r.id}><td>{r.plan_date}</td><td>{r.meal_type}</td><td>{r.title}</td><td>{r.price_cents}</td></tr>))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}



