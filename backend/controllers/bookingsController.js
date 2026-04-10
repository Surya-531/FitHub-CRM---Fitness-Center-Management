const supabase = require('../config/supabase');

// GET /api/bookings  (with joined member, class, trainer names)
exports.getAll = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        members  ( name, membership_type ),
        classes  ( name ),
        trainers ( name )
      `)
      .order('booked_at', { ascending: false });

    if (error) throw error;

    // Flatten for easy frontend consumption
    const flat = data.map(b => ({
      id:             b.id,
      booking_number: b.booking_number,
      member_id:      b.member_id,
      class_id:       b.class_id,
      trainer_id:     b.trainer_id,
      payment_status: b.payment_status,
      amount:         b.amount,
      booked_at:      b.booked_at,
      member_name:    b.members?.name             || '—',
      membership_type:b.members?.membership_type  || '—',
      class_name:     b.classes?.name             || '—',
      trainer_name:   b.trainers?.name            || '—',
    }));

    res.json({ success: true, data: flat });
  } catch (err) {
    next(err);
  }
};

// POST /api/bookings
// Trainer auto-assigned + amount auto-calculated via DB triggers
exports.create = async (req, res, next) => {
  try {
    const { member_id, class_id, payment_status } = req.body;

    if (!member_id || !class_id) {
      return res.status(400).json({
        success: false,
        error: 'member_id and class_id are required',
      });
    }

    // Block pending payments
    if (payment_status === 'Pending') {
      return res.status(400).json({
        success: false,
        error: 'Complete payment before booking.',
      });
    }

    // Check class capacity
    const { data: cls } = await supabase
      .from('classes')
      .select('capacity')
      .eq('id', class_id)
      .single();

    const { count: existing } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('class_id', class_id);

    if (cls && existing >= cls.capacity) {
      return res.status(400).json({
        success: false,
        error: 'Class is full. No slots available.',
      });
    }

    // Insert — DB triggers handle trainer assignment & amount
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        member_id,
        class_id,
        payment_status: payment_status || 'Paid',
      }])
      .select(`
        *,
        members  ( name, membership_type ),
        classes  ( name ),
        trainers ( name )
      `)
      .single();

    if (error) throw error;

    const result = {
      id:             data.id,
      booking_number: data.booking_number,
      member_id:      data.member_id,
      class_id:       data.class_id,
      trainer_id:     data.trainer_id,
      payment_status: data.payment_status,
      amount:         data.amount,
      booked_at:      data.booked_at,
      member_name:    data.members?.name            || '—',
      membership_type:data.members?.membership_type || '—',
      class_name:     data.classes?.name            || '—',
      trainer_name:   data.trainers?.name           || '—',
    };

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/bookings/:id
exports.remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    next(err);
  }
};
