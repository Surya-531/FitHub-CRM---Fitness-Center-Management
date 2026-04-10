const supabase = require('../config/supabase');

// GET /api/classes  (includes booking count + status)
exports.getAll = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('vw_class_popularity')
      .select('*');

    if (error) {
      // Fallback if view doesn't exist yet
      const { data: raw, error: rawErr } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });
      if (rawErr) throw rawErr;
      return res.json({ success: true, data: raw });
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/classes/:id
exports.getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Class not found' });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// POST /api/classes
exports.create = async (req, res, next) => {
  try {
    const { name, capacity, schedule } = req.body;

    if (!name || !capacity) {
      return res.status(400).json({
        success: false,
        error: 'name and capacity are required',
      });
    }

    const { data, error } = await supabase
      .from('classes')
      .insert([{ name, capacity: parseInt(capacity), schedule: schedule || null }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// PUT /api/classes/:id
exports.update = async (req, res, next) => {
  try {
    const { name, capacity, schedule } = req.body;

    const { data, error } = await supabase
      .from('classes')
      .update({ name, capacity, schedule })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/classes/:id
exports.remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Class deleted' });
  } catch (err) {
    next(err);
  }
};
