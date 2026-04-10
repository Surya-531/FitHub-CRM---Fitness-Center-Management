const supabase = require('../config/supabase');

// GET /api/members
exports.getAll = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/members/:id
exports.getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Member not found' });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// POST /api/members
exports.create = async (req, res, next) => {
  try {
    const { name, email, phone, membership_type, expiry_date } = req.body;

    if (!name || !membership_type || !expiry_date) {
      return res.status(400).json({
        success: false,
        error: 'name, membership_type, and expiry_date are required',
      });
    }

    const { data, error } = await supabase
      .from('members')
      .insert([{ name, email, phone, membership_type, expiry_date }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// PUT /api/members/:id
exports.update = async (req, res, next) => {
  try {
    const { name, email, phone, membership_type, expiry_date } = req.body;

    const { data, error } = await supabase
      .from('members')
      .update({ name, email, phone, membership_type, expiry_date })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/members/:id
exports.remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('members')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Member deleted' });
  } catch (err) {
    next(err);
  }
};
