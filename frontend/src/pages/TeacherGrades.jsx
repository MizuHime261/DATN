import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'

export default function TeacherGrades(){
  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [terms, setTerms] = useState([])
  const [selected, setSelected] = useState({ student_user_id:'', subject_id:'', term_id:'' })
  const [scores, setScores] = useState({ oral:'', test:'', exam:'' })
  const canSubmit = useMemo(()=> selected.student_user_id && selected.subject_id && selected.term_id, [selected])
  const [msg, setMsg] = useState('')

  useEffect(()=>{
    (async()=>{
      const [stu, sub, term] = await Promise.all([
        axios.get('/api/teacher/students'),
        axios.get('/api/teacher/subjects'),
        axios.get('/api/teacher/terms')
      ])
      setStudents(stu.data)
      setSubjects(sub.data)
      setTerms(term.data)
    })()
  },[])

  async function save(){
    setMsg('')
    try{
      await axios.post('/api/teacher/grades', {
        ...selected,
        oral: scores.oral? Number(scores.oral) : null,
        test: scores.test? Number(scores.test) : null,
        exam: scores.exam? Number(scores.exam) : null,
      })
      setMsg('Lưu điểm thành công')
    }catch{ setMsg('Lưu điểm thất bại') }
  }

  return (
    <div className="card">
      <h3>Nhập điểm</h3>
      <div className="row mt16">
        <select className="input" value={selected.student_user_id} onChange={e=>setSelected(s=>({...s, student_user_id:e.target.value}))}>
          <option value="">Chọn học sinh</option>
          {students.map(s => <option key={s.id} value={s.id}>{s.username} - {s.class_name}</option>)}
        </select>
        <select className="input" value={selected.subject_id} onChange={e=>setSelected(s=>({...s, subject_id:e.target.value}))}>
          <option value="">Chọn môn</option>
          {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className="input" value={selected.term_id} onChange={e=>setSelected(s=>({...s, term_id:e.target.value}))}>
          <option value="">Chọn học kỳ</option>
          {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>
      <div className="row mt16">
        <input className="input" placeholder="Miệng" value={scores.oral} onChange={e=>setScores(x=>({...x, oral:e.target.value}))} />
        <input className="input" placeholder="Kiểm tra" value={scores.test} onChange={e=>setScores(x=>({...x, test:e.target.value}))} />
        <input className="input" placeholder="Thi" value={scores.exam} onChange={e=>setScores(x=>({...x, exam:e.target.value}))} />
        <button className="btn" disabled={!canSubmit} onClick={save}>Lưu</button>
      </div>
      {msg && <div className="mt16">{msg}</div>}
    </div>
  )
}


