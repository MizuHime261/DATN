import { useEffect, useState } from 'react'
import axios from 'axios'

const ratings = ['Tốt','Khá','Trung bình','Yếu']

export default function TeacherConduct(){
  const [students, setStudents] = useState([])
  const [terms, setTerms] = useState([])
  const [form, setForm] = useState({ student_user_id:'', term_id:'', rating:'Tốt', note:'' })
  const [msg, setMsg] = useState('')

  useEffect(()=>{
    (async()=>{
      const [stu, term] = await Promise.all([
        axios.get('/api/teacher/students'),
        axios.get('/api/teacher/terms')
      ])
      setStudents(stu.data)
      setTerms(term.data)
    })()
  },[])

  async function save(){
    setMsg('')
    try{
      await axios.post('/api/teacher/conduct', form)
      setMsg('Lưu hạnh kiểm thành công')
    }catch{ setMsg('Lưu thất bại') }
  }

  return (
    <div className="card">
      <h3>Đánh giá hạnh kiểm</h3>
      <div className="row mt16">
        <select className="input" value={form.student_user_id} onChange={e=>setForm(f=>({...f, student_user_id:e.target.value}))}>
          <option value="">Chọn học sinh</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.username} - {s.class_name}</option>)}
        </select>
        <select className="input" value={form.term_id} onChange={e=>setForm(f=>({...f, term_id:e.target.value}))}>
          <option value="">Chọn học kỳ</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select className="input" value={form.rating} onChange={e=>setForm(f=>({...f, rating:e.target.value}))}>
          {ratings.map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="mt16">
        <textarea className="input" rows="3" placeholder="Ghi chú" value={form.note} onChange={e=>setForm(f=>({...f, note:e.target.value}))} />
      </div>
      <div className="mt16">
        <button className="btn" onClick={save} disabled={!form.student_user_id || !form.term_id}>Lưu</button>
      </div>
      {msg && <div className="mt16">{msg}</div>}
    </div>
  )
}


