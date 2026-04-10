const supabase = require('../config/supabase');

// GET /api/reports/summary
exports.getSummary = async (req, res, next) => {
  try {
    // Revenue
    const { data: rev } = await supabase
      .from('vw_revenue_summary')
      .select('*')
      .single();

    // Membership breakdown
    const { data: mem } = await supabase
      .from('vw_membership_breakdown')
      .select('*')
      .single();

    // Class popularity
    const { data: cls } = await supabase
      .from('vw_class_popularity')
      .select('*');

    // Booking stats
    const today = new Date().toISOString().split('T')[0];
    const { count: todayBookings } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('booked_at', today + 'T00:00:00Z')
      .lte('booked_at', today + 'T23:59:59Z');

    const { count: totalTrainers } = await supabase
      .from('trainers')
      .select('id', { count: 'exact', head: true });

    const { count: totalClasses } = await supabase
      .from('classes')
      .select('id', { count: 'exact', head: true });

    res.json({
      success: true,
      data: {
        revenue: {
          total_revenue:    parseFloat(rev?.total_revenue  || 0),
          paid_count:       parseInt(rev?.paid_count       || 0),
          pending_count:    parseInt(rev?.pending_count    || 0),
          avg_amount:       parseFloat(rev?.avg_amount     || 0),
        },
        membership: {
          total_members:  parseInt(mem?.total_members  || 0),
          premium_count:  parseInt(mem?.premium_count  || 0),
          basic_count:    parseInt(mem?.basic_count    || 0),
          active_count:   parseInt(mem?.active_count   || 0),
          expired_count:  parseInt(mem?.expired_count  || 0),
        },
        classes:   cls || [],
        bookings: {
          total:          parseInt(rev?.paid_count || 0) + parseInt(rev?.pending_count || 0),
          today:          todayBookings || 0,
          total_trainers: totalTrainers || 0,
          total_classes:  totalClasses  || 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
