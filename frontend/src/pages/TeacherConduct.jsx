import { useEffect, useState } from 'react'
import axios from 'axios'

const ratings = ['Tốt','Khá','Trung bình','Yếu']

export default function TeacherConduct(){
  const [classes, setClasses] = useState([])
  const [terms, setTerms] = useState([])
  const [students, setStudents] = useState([])
  const [conducts, setConducts] = useState({}) // { student_id: { rating, note } }
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTerm, setSelectedTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(()=>{ (async()=>{
    try {
      const [cls, term] = await Promise.all([
        axios.get('/api/teacher/classes'),
        axios.get('/api/teacher/terms')
      ])
      setClasses(cls.data)
      setTerms(term.data)
    } catch {}
  })() }, [])

  useEffect(()=>{ (async()=>{
    if (!selectedClass) {
      setStudents([])
      return
    }
    setLoading(true)
    try {
      const { data } = await axios.get('/api/teacher/students', { 
        params: { class_id: selectedClass } 
      })
      setStudents(data)
      // Load existing conduct if term selected
      if (selectedTerm) {
        loadExistingConducts()
      }
    } finally {
      setLoading(false)
    }
  })() }, [selectedClass])

  async function loadExistingConducts() {
    if (!selectedTerm) return
    try {
      const { data } = await axios.get('/api/teacher/conduct', {
        params: { term_id: selectedTerm }
      })
      const conductMap = {}
      data.forEach(row => {
        conductMap[row.student_user_id] = {
          rating: row.rating || 'Tốt',
          note: row.note || ''
        }
      })
      setConducts(conductMap)
    } catch {}
  }

  useEffect(()=>{ 
    if (selectedTerm) {
      loadExistingConducts()
    }
  }, [selectedTerm])

  function updateConduct(studentId, field, value) {
    setConducts(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }))
  }

  async function saveConduct(studentId) {
    if (!selectedTerm) {
      setMsg('Vui lòng chọn học kỳ')
      return
    }
    
    const conduct = conducts[studentId] || { rating: 'Tốt', note: '' }
    if (!conduct.rating) {
      setMsg('Vui lòng chọn mức hạnh kiểm')
      return
    }
    
    setMsg('')
    try {
      const payload = {
        student_user_id: studentId,
        term_id: selectedTerm,
        rating: conduct.rating,
        note: conduct.note
      }
      console.log('Sending conduct data:', payload)
      
      await axios.post('/api/teacher/conduct', payload)
      setMsg('Lưu hạnh kiểm thành công')
    } catch (err) {
      console.error('Conduct save error:', err.response?.data || err.message)
      setMsg('Lưu hạnh kiểm thất bại: ' + (err.response?.data?.error || err.message))
    }
  }

  async function saveAllConducts() {
    if (!selectedTerm) {
      setMsg('Vui lòng chọn học kỳ')
      return
    }
    
    setMsg('')
    setLoading(true)
    try {
      const promises = Object.entries(conducts).map(([studentId, conduct]) => {
        if (!conduct.rating) return Promise.resolve()
        
        return axios.post('/api/teacher/conduct', {
          student_user_id: studentId,
          term_id: selectedTerm,
          rating: conduct.rating,
          note: conduct.note
        })
      })
      
      await Promise.all(promises.filter(p => p))
      setMsg('Lưu tất cả hạnh kiểm thành công')
    } catch (err) {
      console.error('Save all conducts error:', err.response?.data || err.message)
      setMsg('Lưu hạnh kiểm thất bại: ' + (err.response?.data?.error || err.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h3>Đánh giá hạnh kiểm học sinh</h3>
      
      <div className="row mt16">
        <select 
          className="input" 
          value={selectedClass} 
          onChange={e=>setSelectedClass(e.target.value)}
        >
          <option value="">-- Chọn lớp --</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        
        <select 
          className="input" 
          value={selectedTerm} 
          onChange={e=>setSelectedTerm(e.target.value)}
          disabled={!selectedClass}
        >
          <option value="">-- Chọn học kỳ --</option>
          {terms.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {selectedClass && selectedTerm && (
        <div className="mt24">
          <h4>Danh sách học sinh lớp {classes.find(c => c.id == selectedClass)?.name}</h4>
          <div className="row mt16">
            <button 
              className="btn" 
              onClick={saveAllConducts} 
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu tất cả hạnh kiểm'}
            </button>
          </div>
          
          {loading && students.length === 0 ? (
            <div className="mt16">Đang tải danh sách học sinh...</div>
          ) : (
            <div className="table-responsive mt16">
              <table>
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Hạnh kiểm</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => {
                    const studentConduct = conducts[student.id] || { rating: 'Tốt', note: '' }
                    
                    return (
                      <tr key={student.id}>
                        <td>{student.username}</td>
                        <td>
                          <select 
                            className="input" 
                            value={studentConduct.rating} 
                            onChange={e=>updateConduct(student.id, 'rating', e.target.value)}
                          >
                            {ratings.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input 
                            type="text" 
                            className="input" 
                            value={studentConduct.note} 
                            onChange={e=>updateConduct(student.id, 'note', e.target.value)}
                            placeholder="Ghi chú về hạnh kiểm"
                            style={{width: '200px'}}
                          />
                        </td>
                        <td>
                          <button 
                            className="btn" 
                            onClick={() => saveConduct(student.id)}
                            style={{fontSize: '12px', padding: '4px 8px'}}
                          >
                            Lưu
                          </button>
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

      {msg && <div className="mt16" style={{color: msg.includes('thành công') ? 'green' : 'red'}}>{msg}</div>}
    </div>
  )
}


