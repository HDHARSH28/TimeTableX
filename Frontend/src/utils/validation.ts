interface ValidationError {
  [key: string]: string
}

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validateFaculty = (data: any): ValidationError => {
  const errors: ValidationError = {}
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required'
  }
  if (data.name && data.name.length < 3) {
    errors.name = 'Name must be at least 3 characters'
  }
  if (!data.subjects || data.subjects.length === 0) {
    errors.subjects = 'At least one subject is required'
  }
  if (!data.maxClassesPerDay || data.maxClassesPerDay < 1) {
    errors.maxClassesPerDay = 'Max classes per day must be at least 1'
  }
  
  return errors
}

export const validateSubject = (data: any): ValidationError => {
  const errors: ValidationError = {}
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Subject name is required'
  }
  if (!data.semester || data.semester === '') {
    errors.semester = 'Semester is required'
  }
  if (!data.hoursPerWeek || data.hoursPerWeek < 1) {
    errors.hoursPerWeek = 'Hours per week must be at least 1'
  }
  if (!data.faculty || data.faculty.length === 0) {
    errors.faculty = 'At least one faculty member is required'
  }
  
  return errors
}

export const validateClass = (data: any): ValidationError => {
  const errors: ValidationError = {}
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Class name is required'
  }
  if (!data.department || data.department === '') {
    errors.department = 'Department is required'
  }
  if (!data.semester || data.semester === '') {
    errors.semester = 'Semester is required'
  }
  if (!data.maxStudents || data.maxStudents < 1) {
    errors.maxStudents = 'Max students must be at least 1'
  }
  
  return errors
}

export const validateClassroom = (data: any): ValidationError => {
  const errors: ValidationError = {}
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Classroom name is required'
  }
  if (!data.capacity || data.capacity < 1) {
    errors.capacity = 'Capacity must be at least 1'
  }
  
  return errors
}

export const validateLogin = (data: any): ValidationError => {
  const errors: ValidationError = {}
  
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required'
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email'
  }
  
  if (!data.password || data.password === '') {
    errors.password = 'Password is required'
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  
  return errors
}

export const validateRegister = (data: any): ValidationError => {
  const errors: ValidationError = {}
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required'
  }
  if (!data.email || data.email.trim() === '') {
    errors.email = 'Email is required'
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email'
  }
  if (!data.password || data.password === '') {
    errors.password = 'Password is required'
  } else if (data.password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }
  
  return errors
}
