const User = require('../models/user.model');
const Subject = require('../models/subject.model');
const ClassRoom = require('../models/classRoom.model');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/audit.service');

// ==========================================
// TEACHERS MANAGEMENT
// ==========================================

/**
 * GET /api/admin/teachers
 * Retrieve list of all teachers (with optional search)
 */
const getTeachers = asyncHandler(async (req, res, next) => {
  const { search } = req.query;
  const filter = { role: 'teacher' };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { subject: { $regex: search, $options: 'i' } }
    ];
  }

  const teachers = await User.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Teachers retrieved successfully',
    data: teachers
  });
});

/**
 * GET /api/admin/teachers/:id
 * Retrieve single teacher by ID
 */
const getTeacherById = asyncHandler(async (req, res, next) => {
  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });

  if (!teacher) {
    return next(new ApiError(404, 'Teacher not found.'));
  }

  res.status(200).json({
    success: true,
    message: 'Teacher details retrieved',
    data: teacher
  });
});

/**
 * POST /api/admin/teachers
 * Create a new teacher user
 */
const createTeacher = asyncHandler(async (req, res, next) => {
  const { name, email, password, subject, cohort } = req.body;

  if (!name || !email || !password) {
    return next(new ApiError(400, 'Name, email, and password are required fields.'));
  }

  // Check email uniqueness
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return next(new ApiError(400, 'Email address is already in use.'));
  }

  const teacher = await User.create({
    name,
    email,
    password,
    subject: subject || '',
    cohort: cohort || '',
    role: 'teacher',
    isActive: true
  });

  // Log action
  try {
    await auditService.logAction({
      userId: req.user._id,
      action: 'teacher_created',
      details: { teacherId: teacher._id, name: teacher.name, email: teacher.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for teacher creation failed:', err);
  }

  const responseObj = teacher.toObject();
  delete responseObj.password;

  res.status(201).json({
    success: true,
    message: 'Teacher created successfully',
    data: responseObj
  });
});

/**
 * PUT /api/admin/teachers/:id
 * Update teacher details
 */
const updateTeacher = asyncHandler(async (req, res, next) => {
  const { name, email, subject, cohort } = req.body;

  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
  if (!teacher) {
    return next(new ApiError(404, 'Teacher not found.'));
  }

  // If email changes, check uniqueness
  if (email && email.toLowerCase() !== teacher.email.toLowerCase()) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return next(new ApiError(400, 'Email address is already in use by another user.'));
    }
    teacher.email = email;
  }

  if (name) teacher.name = name;
  if (subject !== undefined) teacher.subject = subject;
  if (cohort !== undefined) teacher.cohort = cohort;

  await teacher.save();

  // Log action
  try {
    await auditService.logAction({
      userId: req.user._id,
      action: 'teacher_updated',
      details: { teacherId: teacher._id, name: teacher.name, email: teacher.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for teacher update failed:', err);
  }

  const responseObj = teacher.toObject();
  delete responseObj.password;

  res.status(200).json({
    success: true,
    message: 'Teacher details updated successfully',
    data: responseObj
  });
});

/**
 * DELETE /api/admin/teachers/:id
 * Delete a teacher account
 */
const deleteTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
  if (!teacher) {
    return next(new ApiError(404, 'Teacher not found.'));
  }

  await User.deleteOne({ _id: teacher._id });

  // Log action
  try {
    await auditService.logAction({
      userId: req.user._id,
      action: 'teacher_deleted',
      details: { teacherId: teacher._id, name: teacher.name, email: teacher.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for teacher deletion failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Teacher deleted successfully'
  });
});

/**
 * PATCH /api/admin/teachers/:id/toggle-status
 * Toggle activation/deactivation of a teacher account
 */
const toggleTeacherStatus = asyncHandler(async (req, res, next) => {
  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
  if (!teacher) {
    return next(new ApiError(404, 'Teacher not found.'));
  }

  teacher.isActive = !teacher.isActive;
  await teacher.save();

  // Log action
  try {
    await auditService.logAction({
      userId: req.user._id,
      action: 'teacher_status_toggled',
      details: { teacherId: teacher._id, name: teacher.name, isActive: teacher.isActive },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for teacher status toggle failed:', err);
  }

  res.status(200).json({
    success: true,
    message: `Teacher account ${teacher.isActive ? 'activated' : 'deactivated'} successfully`,
    data: { isActive: teacher.isActive }
  });
});

/**
 * POST /api/admin/teachers/:id/reset-password
 * Reset a teacher's password
 */
const resetTeacherPassword = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    return next(new ApiError(400, 'Password is required and must be at least 6 characters.'));
  }

  const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });
  if (!teacher) {
    return next(new ApiError(404, 'Teacher not found.'));
  }

  teacher.password = password;
  await teacher.save();

  // Log action
  try {
    await auditService.logAction({
      userId: req.user._id,
      action: 'teacher_password_reset',
      details: { teacherId: teacher._id, name: teacher.name, email: teacher.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for teacher password reset failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Teacher password reset successfully'
  });
});

// ==========================================
// STUDENTS MANAGEMENT
// ==========================================

/**
 * GET /api/admin/students
 * Retrieve list of all students (with search)
 */
const getStudents = asyncHandler(async (req, res, next) => {
  const { search } = req.query;
  const filter = { role: 'student' };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { cohort: { $regex: search, $options: 'i' } }
    ];
  }

  const students = await User.find(filter).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Students retrieved successfully',
    data: students
  });
});

/**
 * GET /api/admin/students/:id
 * Retrieve single student by ID
 */
const getStudentById = asyncHandler(async (req, res, next) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });

  if (!student) {
    return next(new ApiError(404, 'Student not found.'));
  }

  res.status(200).json({
    success: true,
    message: 'Student details retrieved',
    data: student
  });
});

/**
 * POST /api/admin/students
 * Create a new student user
 */
const createStudent = asyncHandler(async (req, res, next) => {
  const { name, email, password, cohort, subjects } = req.body;

  if (!name || !email || !password) {
    return next(new ApiError(400, 'Name, email, and password are required fields.'));
  }

  // Check email uniqueness
  const emailExists = await User.findOne({ email });
  if (emailExists) {
    return next(new ApiError(400, 'Email address is already in use.'));
  }

  const student = await User.create({
    name,
    email,
    password,
    cohort: cohort || '',
    subjects: subjects || [],
    role: 'student',
    isActive: true
  });

  // Log action
  try {
    await auditService.logAction({
      userId: req.user._id,
      action: 'student_created',
      details: { studentId: student._id, name: student.name, email: student.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for student creation failed:', err);
  }

  const responseObj = student.toObject();
  delete responseObj.password;

  res.status(201).json({
    success: true,
    message: 'Student created successfully',
    data: responseObj
  });
});

/**
 * PUT /api/admin/students/:id
 * Update student details
 */
const updateStudent = asyncHandler(async (req, res, next) => {
  const { name, email, cohort, subjects } = req.body;

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) {
    return next(new ApiError(404, 'Student not found.'));
  }

  // If email changes, check uniqueness
  if (email && email.toLowerCase() !== student.email.toLowerCase()) {
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return next(new ApiError(400, 'Email address is already in use by another user.'));
    }
    student.email = email;
  }

  if (name) student.name = name;
  if (cohort !== undefined) student.cohort = cohort;
  if (subjects !== undefined) student.subjects = subjects;

  await student.save();

  // Log action
  try {
    await auditService.logAction({
      userId: req.user._id,
      action: 'student_updated',
      details: { studentId: student._id, name: student.name, email: student.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for student update failed:', err);
  }

  const responseObj = student.toObject();
  delete responseObj.password;

  res.status(200).json({
    success: true,
    message: 'Student details updated successfully',
    data: responseObj
  });
});

/**
 * DELETE /api/admin/students/:id
 * Delete a student account
 */
const deleteStudent = asyncHandler(async (req, res, next) => {
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) {
    return next(new ApiError(404, 'Student not found.'));
  }

  await User.deleteOne({ _id: student._id });

  // Log action
  try {
    await auditService.logAction({
      userId: req.user._id,
      action: 'student_deleted',
      details: { studentId: student._id, name: student.name, email: student.email },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for student deletion failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Student deleted successfully'
  });
});

/**
 * PATCH /api/admin/students/:id/assign-batch
 * Assign cohort/batch to student
 */
const assignStudentBatch = asyncHandler(async (req, res, next) => {
  const { cohort } = req.body;

  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) {
    return next(new ApiError(404, 'Student not found.'));
  }

  student.cohort = cohort || '';
  await student.save();

  // Log action
  try {
    await auditService.logAction({
      userId: req.user._id,
      action: 'student_cohort_assigned',
      details: { studentId: student._id, name: student.name, cohort: student.cohort },
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  } catch (err) {
    console.error('Audit logging for student cohort assignment failed:', err);
  }

  res.status(200).json({
    success: true,
    message: 'Batch assigned successfully',
    data: { cohort: student.cohort }
  });
});

/**
 * POST /api/admin/students/upload
 * Bulk upload student accounts using CSV/Excel spreadsheet
 */
const uploadBulkStudents = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ApiError(400, 'Please upload a valid Excel (.xlsx) or CSV (.csv) file.'));
  }

  const isPreview = req.query.preview === 'true';

  const XLSX = require('xlsx');
  const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '' });

  const results = {
    totalRows: rawRows.length,
    importedCount: 0,
    errors: [],
    imported: []
  };

  const parsedStudents = [];

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const name = row.name || row.Name || '';
    const email = row.email || row.Email || '';
    const password = row.password || row.Password || 'password123';
    const cohort = row.cohort || row.Cohort || row.batch || row.Batch || '';

    const rowErrors = [];
    if (!name.toString().trim()) {
      rowErrors.push(`Row ${i + 2}: Name is required.`);
    }
    if (!email.toString().trim()) {
      rowErrors.push(`Row ${i + 2}: Email is required.`);
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      rowErrors.push(`Row ${i + 2}: Please provide a valid email.`);
    }

    if (rowErrors.length > 0) {
      results.errors.push(...rowErrors);
    } else {
      parsedStudents.push({
        name: name.toString().trim(),
        email: email.toString().trim().toLowerCase(),
        password: password.toString().trim(),
        cohort: cohort.toString().trim(),
        role: 'student',
        isActive: true
      });
    }
  }

  if (results.errors.length === 0 && !isPreview && parsedStudents.length > 0) {
    // Check duplicates before inserting
    for (let student of parsedStudents) {
      const exists = await User.findOne({ email: student.email });
      if (exists) {
        results.errors.push(`Student with email ${student.email} already exists.`);
      }
    }

    if (results.errors.length === 0) {
      const createdDocs = [];
      for (let s of parsedStudents) {
        const doc = await User.create(s);
        createdDocs.push(doc);
      }
      results.importedCount = createdDocs.length;
      results.imported = createdDocs.map(d => ({ _id: d._id, name: d.name, email: d.email, cohort: d.cohort }));

      // Log action
      try {
        await auditService.logAction({
          userId: req.user._id,
          action: 'students_bulk_uploaded',
          details: { importedCount: results.importedCount },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });
      } catch (err) {
        console.error('Audit logging for student bulk upload failed:', err);
      }
    }
  }

  res.status(200).json({
    success: results.errors.length === 0,
    message: results.errors.length > 0 
      ? 'Errors found during spreadsheet parsing.' 
      : isPreview 
      ? 'Spreadsheet validated successfully (Preview Mode).' 
      : `Successfully imported ${results.importedCount} student accounts.`,
    data: results
  });
});

// ==========================================
// SUBJECTS & CLASSES (COHORTS) MANAGEMENT
// ==========================================

/**
 * GET /api/admin/subjects
 * Get all subjects (accessible to all authenticated users)
 */
const getSubjects = asyncHandler(async (req, res, next) => {
  const subjects = await Subject.find().sort({ name: 1 });
  res.status(200).json({
    success: true,
    message: 'Subjects retrieved successfully',
    data: subjects
  });
});

/**
 * POST /api/admin/subjects
 * Create a new subject (Admin only)
 */
const createSubject = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return next(new ApiError(400, 'Subject name is required.'));
  }

  const exists = await Subject.findOne({ name: name.trim() });
  if (exists) {
    return next(new ApiError(400, 'Subject already exists.'));
  }

  const subject = await Subject.create({ name: name.trim() });
  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: subject
  });
});

/**
 * DELETE /api/admin/subjects/:id
 * Delete a subject (Admin only)
 */
const deleteSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findById(req.params.id);
  if (!subject) {
    return next(new ApiError(404, 'Subject not found.'));
  }

  await Subject.deleteOne({ _id: subject._id });
  res.status(200).json({
    success: true,
    message: 'Subject deleted successfully'
  });
});

/**
 * GET /api/admin/classes
 * Get all classes (accessible to all authenticated users)
 */
const getClassRooms = asyncHandler(async (req, res, next) => {
  const classes = await ClassRoom.find().sort({ name: 1 });
  res.status(200).json({
    success: true,
    message: 'Classes retrieved successfully',
    data: classes
  });
});

/**
 * POST /api/admin/classes
 * Create a new class (Admin only)
 */
const createClassRoom = asyncHandler(async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return next(new ApiError(400, 'Class name is required.'));
  }

  const exists = await ClassRoom.findOne({ name: name.trim() });
  if (exists) {
    return next(new ApiError(400, 'Class already exists.'));
  }

  const classroom = await ClassRoom.create({ name: name.trim() });
  res.status(201).json({
    success: true,
    message: 'Class created successfully',
    data: classroom
  });
});

/**
 * DELETE /api/admin/classes/:id
 * Delete a class (Admin only)
 */
const deleteClassRoom = asyncHandler(async (req, res, next) => {
  const classroom = await ClassRoom.findById(req.params.id);
  if (!classroom) {
    return next(new ApiError(404, 'Class not found.'));
  }

  await ClassRoom.deleteOne({ _id: classroom._id });
  res.status(200).json({
    success: true,
    message: 'Class deleted successfully'
  });
});

module.exports = {
  getTeachers,
  getTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  toggleTeacherStatus,
  resetTeacherPassword,
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  assignStudentBatch,
  uploadBulkStudents,
  getSubjects,
  createSubject,
  deleteSubject,
  getClassRooms,
  createClassRoom,
  deleteClassRoom
};
