const express = require('express');
const router = express.Router();
const { getTasks, createTask, updateTask, deleteTask, getDashboardSummary, getInsight, toggleSubTask } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/insight', getInsight);
router.get('/calendar', require('../controllers/taskController').exportCalendar);

router.get('/dashboard', getDashboardSummary);
router.route('/').get(getTasks).post(createTask);
router.route('/:id').put(updateTask).delete(deleteTask);
router.put('/:id/subtasks/:subTaskId', toggleSubTask);

module.exports = router;
