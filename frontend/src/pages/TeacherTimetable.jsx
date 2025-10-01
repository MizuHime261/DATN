import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { useAuth } from '../state/AuthContext'

const DAYS = ['Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7','Chủ nhật']

export default function TeacherTimetable(){
  const { token } = useAuth()
  const [terms, setTerms] = useState([])
  const [selectedTerm, setSelectedTerm] = useState('')
  const [periods, setPeriods] = useState([])
  const [personalRows, setPersonalRows] = useState([])
  const [homeroomClass, setHomeroomClass] = useState(null)
  const [homeroomRows, setHomeroomRows] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(()=>{ (async()=>{
    if (!token) return
    try {
      const [t, p, h] = await Promise.all([
        axios.get('/api/teacher/terms'),
        axios.get('/api/teacher/periods'),
        axios.get('/api/teacher/homeroom')
      ])
      setTerms(t.data)
      setPeriods(p.data)
      setHomeroomClass(h.data)
    } catch {}
  })() }, [token])

  useEffect(()=>{ (async()=>{
    if (!token) return
    setLoading(true)
    try{
      const [{ data: me }, { data: classTt }] = await Promise.all([
        axios.get('/api/teacher/timetable', { params: selectedTerm ? { term_id: selectedTerm } : {} }),
        homeroomClass ? axios.get('/api/teacher/class-timetable', { params: { class_id: homeroomClass.id, ...(selectedTerm? { term_id: selectedTerm } : {}) } }) : Promise.resolve({ data: [] })
      ])
      setPersonalRows(me)
      setHomeroomRows(classTt)
    } finally { setLoading(false) }
  })() }, [selectedTerm, homeroomClass, token])

  const levelPeriods = useMemo(()=>{
    // Không có level hiện tại: dùng toàn bộ periods để tìm max
    return periods
  }, [periods])

  const maxPeriods = useMemo(()=>{
    const max = Math.max(0, ...levelPeriods.map(p => Number(p.period_index||0)))
    return max || 5
  }, [levelPeriods])

  const personalMatrix = useMemo(()=>{
    const grid = Array.from({ length: maxPeriods }, () => Array(DAYS.length).fill(null))
    for (const entry of personalRows) {
      const dayIdx = Number(entry.day_of_week || 0) - 1
      const periodIdx = Number(entry.period_index || 1) - 1
      if (dayIdx>=0 && dayIdx<DAYS.length && periodIdx>=0 && periodIdx<maxPeriods) {
        grid[periodIdx][dayIdx] = entry
      }
    }
    return grid
  }, [personalRows, maxPeriods])

  const homeroomMatrix = useMemo(()=>{
    const grid = Array.from({ length: maxPeriods }, () => Array(DAYS.length).fill(null))
    for (const entry of homeroomRows) {
      const dayIdx = Number(entry.day_of_week || 0) - 1
      const periodIdx = Number(entry.period_index || 1) - 1
      if (dayIdx>=0 && dayIdx<DAYS.length && periodIdx>=0 && periodIdx<maxPeriods) {
        grid[periodIdx][dayIdx] = entry
      }
    }
    return grid
  }, [homeroomRows, maxPeriods])

  function renderMatrix(matrix, title){
    return (
      <div className="card" style={{marginTop:16}}>
        <h4>{title}</h4>
        <div className="timetable-matrix">
          <table className="timetable-table">
            <thead>
              <tr>
                <th>Thứ</th>
                {Array.from({ length: maxPeriods }, (_, i) => (
                  <th key={i + 1}>Tiết {i + 1}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, dayIdx) => (
                <tr key={dayIdx}>
                  <td className="day-header">{day}</td>
                  {Array.from({ length: maxPeriods }, (_, i) => {
                    const periodIndex = i + 1
                    const entry = matrix[i][dayIdx]
                    return (
                      <td key={periodIndex} className="timetable-cell">
                        {entry ? (
                          <div className="entry">
                            <div className="subject">{entry.subject_name}</div>
                            <div className="teacher">{entry.teacher_name || ''}</div>
                            <div className="class">{entry.class_name || ''}</div>
                          </div>
                        ) : (
                          <div className="empty-slot" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3>Thời khóa biểu giáo viên</h3>
      <div className="row mt16">
        <select
          className="input"
          value={selectedTerm}
          onChange={e=>setSelectedTerm(e.target.value)}
        >
          <option value="">-- Chọn học kỳ (tùy chọn) --</option>
          {terms.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="mt16">Đang tải...</div>}

      {renderMatrix(personalMatrix, 'Thời khóa biểu cá nhân')}

      {homeroomClass
        ? renderMatrix(homeroomMatrix, `Thời khóa biểu lớp chủ nhiệm (${homeroomClass.name})`)
        : (
          <div className="card" style={{marginTop:16}}>
            <h4>Thời khóa biểu lớp chủ nhiệm</h4>
            <div className="mt16">Bạn chưa được gán làm giáo viên chủ nhiệm lớp nào.</div>
          </div>
        )}
    </div>
  )
}


