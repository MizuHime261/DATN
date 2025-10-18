import { useState, useEffect } from 'react'
import axios from 'axios'

export default function ParentBoarding(){
  const [terms, setTerms] = useState([])
  const [selectedTerm, setSelectedTerm] = useState('')
  const [meals, setMeals] = useState([])
  const [registeredMeals, setRegisteredMeals] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Load terms
  useEffect(() => {
    async function loadTerms() {
      try {
        const { data } = await axios.get('/api/parent/terms')
        setTerms(data)
      } catch (error) {
        console.error('Error loading terms:', error)
        setMessage('Lỗi khi tải danh sách học kỳ: ' + (error.response?.data?.error || error.message))
      }
    }
    loadTerms()
  }, [])

  // Load meals when term is selected
  useEffect(() => {
    if (selectedTerm) {
      loadMeals()
      loadRegisteredMeals()
    } else {
      setMeals([])
      setRegisteredMeals([])
    }
  }, [selectedTerm])

  async function loadMeals() {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/parent/meals', {
        params: { term_id: selectedTerm }
      })
      setMeals(data)
    } catch (error) {
      console.error('Error loading meals:', error)
      setMessage('Lỗi khi tải danh sách bữa ăn: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  async function loadRegisteredMeals() {
    try {
      const { data } = await axios.get('/api/parent/registered-meals', {
        params: { term_id: selectedTerm }
      })
      setRegisteredMeals(data)
    } catch (error) {
      console.error('Error loading registered meals:', error)
    }
  }

  async function generateInvoices() {
    try {
      setLoading(true)
      const { data } = await axios.post('/api/parent/generate-meal-invoices')
      setMessage(`Tạo hóa đơn thành công! Đã tạo ${data.invoices_created} hóa đơn cho ${data.meals_processed} bữa ăn`)
    } catch (error) {
      console.error('Error generating invoices:', error)
      setMessage('Có lỗi xảy ra khi tạo hóa đơn')
    } finally {
      setLoading(false)
    }
  }

  async function toggleMealRegistration(mealId, isRegistered) {
    try {
      if (isRegistered) {
        await axios.delete(`/api/parent/meal-registration/${mealId}`)
        setMessage('Hủy đăng ký bữa ăn thành công')
      } else {
        await axios.post(`/api/parent/meal-registration/${mealId}`)
        setMessage('Đăng ký bữa ăn thành công')
      }
      // Reload registered meals
      loadRegisteredMeals()
    } catch (error) {
      console.error('Error toggling meal registration:', error)
      setMessage('Có lỗi xảy ra khi đăng ký/hủy bữa ăn')
    }
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  function isPastDate(dateString) {
    const today = new Date()
    const mealDate = new Date(dateString)
    today.setHours(0, 0, 0, 0)
    mealDate.setHours(0, 0, 0, 0)
    return mealDate < today
  }

  function isMealRegistered(mealId) {
    return registeredMeals.some(rm => rm.meal_id === mealId)
  }

  return (
    <div className="parent-boarding-page">
      <div className="card">
        <h3>Đăng ký bữa ăn nội trú</h3>
        
        {/* Semester Selection */}
        <div className="form-section">
          <label className="form-label">Chọn học kỳ:</label>
          <select 
            className="input" 
            value={selectedTerm} 
            onChange={e => setSelectedTerm(e.target.value)}
          >
            <option value="">-- Chọn học kỳ --</option>
            {terms.map(term => (
              <option key={term.id} value={term.id}>
                {term.name} ({formatDate(term.start_date)} - {formatDate(term.end_date)})
              </option>
            ))}
          </select>
        </div>

        {/* Message */}
        {message && (
          <div className={`message ${message.includes('thành công') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        {/* Generate Invoices Button */}
        {selectedTerm && (
          <div className="invoice-section">
            <button 
              className="btn btn-primary" 
              onClick={generateInvoices}
              disabled={loading}
            >
              {loading ? 'Đang tạo...' : 'Tạo hóa đơn từ bữa ăn đã đăng ký'}
            </button>
            <p className="invoice-note">
              Hóa đơn sẽ được tạo tự động từ các bữa ăn đã đăng ký và hiển thị ở trang thanh toán
            </p>
          </div>
        )}

        {/* Meals List */}
        {selectedTerm && (
          <div className="meals-section">
            <h4>Danh sách bữa ăn</h4>
            {loading ? (
              <div className="loading">Đang tải...</div>
            ) : meals.length === 0 ? (
              <div className="no-meals">Không có bữa ăn nào trong học kỳ này</div>
            ) : (
              <div className="meals-grid">
                {meals.map(meal => {
                  const isRegistered = isMealRegistered(meal.id)
                  const isPast = isPastDate(meal.plan_date)
                  const canToggle = !isPast || isRegistered
                  
                  return (
                    <div key={meal.id} className={`meal-card ${isPast ? 'past' : ''} ${isRegistered ? 'registered' : ''}`}>
                      <div className="meal-info">
                        <div className="meal-date">{formatDate(meal.plan_date)}</div>
                        <div className="meal-type">{meal.meal_type}</div>
                        <div className="meal-title">{meal.title}</div>
                        <div className="meal-price">
                          {new Intl.NumberFormat('vi-VN', { 
                            style: 'currency', 
                            currency: 'VND' 
                          }).format(meal.price_cents)}
                        </div>
                      </div>
                      <div className="meal-actions">
                        <label className="checkbox-container">
                          <input
                            type="checkbox"
                            checked={isRegistered}
                            disabled={!canToggle}
                            onChange={() => toggleMealRegistration(meal.id, isRegistered)}
                          />
                          <span className="checkmark"></span>
                          <span className="checkbox-label">
                            {isRegistered ? 'Đã đăng ký' : 'Đăng ký'}
                          </span>
                        </label>
                        {isPast && !isRegistered && (
                          <div className="past-notice">Không thể đăng ký bữa ăn đã qua</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
      </div>
        )}

        {!selectedTerm && (
          <div className="no-selection">
            <p>Vui lòng chọn học kỳ để xem danh sách bữa ăn</p>
      </div>
        )}
      </div>

      <style jsx>{`
        .parent-boarding-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .message {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .message.success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .invoice-section {
          margin-bottom: 24px;
          padding: 16px;
          background-color: #f8f9fa;
          border-radius: 8px;
          text-align: center;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-bottom: 8px;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
        }

        .btn-primary:disabled {
          background-color: #6c757d;
          cursor: not-allowed;
        }

        .invoice-note {
          font-size: 14px;
          color: #666;
          margin: 0;
        }

        .meals-section h4 {
          margin-bottom: 16px;
          color: #333;
        }

        .loading, .no-meals, .no-selection {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .meals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 16px;
        }

        .meal-card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 16px;
          background: white;
          transition: all 0.2s;
        }

        .meal-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .meal-card.past {
          opacity: 0.7;
          background-color: #f8f9fa;
        }

        .meal-card.registered {
          border-color: #28a745;
          background-color: #f8fff9;
        }

        .meal-info {
          margin-bottom: 12px;
        }

        .meal-date {
          font-weight: 600;
          color: #007bff;
          margin-bottom: 4px;
        }

        .meal-type {
          font-size: 14px;
          color: #666;
          margin-bottom: 4px;
        }

        .meal-title {
          font-weight: 500;
          margin-bottom: 8px;
        }

        .meal-price {
          font-weight: 600;
          color: #28a745;
          font-size: 16px;
        }

        .meal-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .checkbox-container input[type="checkbox"] {
          margin-right: 8px;
        }

        .checkbox-label {
          font-size: 14px;
          color: #333;
        }

        .past-notice {
          font-size: 12px;
          color: #dc3545;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .meals-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}