const express = require('express');
const Expense = require('../models/Expense');

const router = express.Router();

const allowedCategories = ['Food', 'Travel', 'Bills', 'Shopping', 'Other'];

function validateExpense(data) {
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const amount = Number(data.amount);
  const category = data.category;
  const date = new Date(data.date);

  if (!title) return 'Please enter a title.';
  if (!Number.isFinite(amount) || amount <= 0) {
    return 'Amount must be greater than zero.';
  }
  if (!allowedCategories.includes(category)) {
    return 'Please choose a valid category.';
  }
  if (!data.date || Number.isNaN(date.getTime())) {
    return 'Please choose a valid date.';
  }

  return null;
}

// Get all expenses
router.get('/', async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Could not load expenses.' });
  }
});

// Add an expense
router.post('/', async (req, res) => {
  const validationError = validateExpense(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const expense = await Expense.create({
      ...req.body,
      title: req.body.title.trim(),
      amount: Number(req.body.amount)
    });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Could not save the expense.' });
  }
});

// Edit an expense
router.put('/:id', async (req, res) => {
  const validationError = validateExpense(req.body);
  if (validationError) {
    return res.status(400).json({ message: validationError });
  }

  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        title: req.body.title.trim(),
        amount: Number(req.body.amount)
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: 'Could not update the expense.' });
  }
});

// Delete an expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found.' });
    }

    res.json({ message: 'Expense deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete the expense.' });
  }
});

module.exports = router;