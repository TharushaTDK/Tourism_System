import { Request, Response } from 'express';
import pool from '../config/database';

export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [activeTours, revenue, tourists, driversOnline, bookingsToday, topDestinations, nationalityBreakdown, monthlyRevenue] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM trips WHERE status='in_progress'`),
      pool.query(`SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE status='success'`),
      pool.query(`SELECT COUNT(*) FROM users WHERE role='tourist'`),
      pool.query(`SELECT COUNT(DISTINCT driver_id) FROM trips WHERE status='in_progress'`),
      pool.query(`SELECT COUNT(*) FROM bookings WHERE DATE(created_at)=CURRENT_DATE`),
      pool.query(`SELECT d.name, COUNT(b.id) as booking_count FROM destinations d LEFT JOIN itinerary_items ii ON ii.reference_id=d.id AND ii.type='destination' LEFT JOIN bookings b ON b.booking_type='hotel' GROUP BY d.id, d.name ORDER BY booking_count DESC LIMIT 5`),
      pool.query(`SELECT COALESCE(nationality,'Unknown') as nationality, COUNT(*) as count FROM users WHERE role='tourist' GROUP BY nationality ORDER BY count DESC LIMIT 10`),
      pool.query(`SELECT DATE_TRUNC('month', payment_date) as month, SUM(amount) as revenue FROM payments WHERE status='success' GROUP BY month ORDER BY month DESC LIMIT 12`),
    ]);
    res.json({
      success: true, message: 'Dashboard stats', data: {
        active_tours: Number(activeTours.rows[0].count),
        total_revenue: Number(revenue.rows[0].total),
        tourist_count: Number(tourists.rows[0].count),
        drivers_online: Number(driversOnline.rows[0].count),
        bookings_today: Number(bookingsToday.rows[0].count),
        top_destinations: topDestinations.rows,
        nationality_breakdown: nationalityBreakdown.rows,
        monthly_revenue: monthlyRevenue.rows,
      }
    });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getTouristAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [registrations, byNationality, byMonth, repeatRate] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM users WHERE role='tourist'`),
      pool.query(`SELECT COALESCE(nationality,'Unknown') as nationality, COUNT(*) as count FROM users WHERE role='tourist' GROUP BY nationality ORDER BY count DESC LIMIT 20`),
      pool.query(`SELECT DATE_TRUNC('month', created_at) as month, COUNT(*) as new_tourists FROM users WHERE role='tourist' GROUP BY month ORDER BY month DESC LIMIT 12`),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE trip_count > 1) as repeat_count,
          COUNT(*) as total_with_trips
        FROM (SELECT user_id, COUNT(*) as trip_count FROM itineraries GROUP BY user_id) t
      `),
    ]);
    const totalWithTrips = Number(repeatRate.rows[0].total_with_trips);
    const repeatCount = Number(repeatRate.rows[0].repeat_count);
    res.json({
      success: true, message: 'Tourist analytics', data: {
        total: Number(registrations.rows[0].count),
        by_nationality: byNationality.rows,
        monthly_registrations: byMonth.rows,
        repeat_tourist_rate: totalWithTrips > 0 ? Math.round((repeatCount / totalWithTrips) * 100) : 0,
      }
    });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getRevenueAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [monthly, byType, total, avgSpend] = await Promise.all([
      pool.query(`SELECT DATE_TRUNC('month', p.payment_date) as month, SUM(p.amount) as revenue, COUNT(p.id) as transactions FROM payments p WHERE p.status='success' GROUP BY month ORDER BY month DESC LIMIT 12`),
      pool.query(`SELECT b.booking_type, SUM(p.amount) as revenue, COUNT(p.id) as count FROM payments p JOIN bookings b ON p.booking_id=b.id WHERE p.status='success' GROUP BY b.booking_type`),
      pool.query(`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as count FROM payments WHERE status='success'`),
      pool.query(`SELECT COALESCE(AVG(estimated_cost),0) as avg FROM itineraries WHERE estimated_cost > 0`),
    ]);
    res.json({ success: true, message: 'Revenue analytics', data: { total_revenue: Number(total.rows[0].total), total_transactions: Number(total.rows[0].count), monthly, by_booking_type: byType.rows, avg_trip_spend: Number(avgSpend.rows[0].avg) } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};

export const getRouteAnalytics = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [popular, avgDuration] = await Promise.all([
      pool.query(`SELECT origin, destination, COUNT(*) as trip_count FROM trips GROUP BY origin, destination ORDER BY trip_count DESC LIMIT 10`),
      pool.query(`SELECT AVG(total_days) as avg_days FROM itineraries WHERE status='completed'`),
    ]);
    res.json({ success: true, message: 'Route analytics', data: { popular_routes: popular.rows, avg_trip_duration: avgDuration.rows[0].avg_days } });
  } catch (err) { console.error(err); res.status(500).json({ success: false, message: 'Server error' }); }
};
