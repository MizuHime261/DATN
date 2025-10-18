-- Kiểm tra số tiết học hiện tại trong database
SELECT 
    level_id,
    day_of_week,
    COUNT(*) as total_periods,
    MIN(period_index) as min_period,
    MAX(period_index) as max_period
FROM periods 
GROUP BY level_id, day_of_week 
ORDER BY level_id, day_of_week;

-- Kiểm tra tổng số periods theo level
SELECT 
    level_id,
    COUNT(*) as total_periods
FROM periods 
GROUP BY level_id 
ORDER BY level_id;
