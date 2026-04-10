const supabase = require('../config/supabase');

// GET /api/trainers
exports.getAll = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// GET /api/trainers/:id
exports.getOne = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, error: 'Trainer not found' });

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// POST /api/trainers
exports.create = async (req, res, next) => {
  try {
    const { name, specialization, phone, is_available } = req.body;

    if (!name || !specialization) {
      return res.status(400).json({
        success: false,
        error: 'name and specialization are required',
      });
    }

    const { data, error } = await supabase
      .from('trainers')
      .insert([{ name, specialization, phone, is_available: is_available !== false }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// PUT /api/trainers/:id
exports.update = async (req, res, next) => {
  try {
    const { name, specialization, phone, is_available } = req.body;

    const { data, error } = await supabase
      .from('trainers')
      .update({ name, specialization, phone, is_available })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/trainers/:id
exports.remove = async (req, res, next) => {
  try {
    const { error } = await supabase
      .from('trainers')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Trainer deleted' });
  } catch (err) {
    next(err);
  }
};
