const {
  sequelize,
  User,
  Department,
  Faculty,
  Subject,
  Classroom
} = require('./models');

const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    // Sync and force clear tables
    await sequelize.sync({ force: true });
    console.log('Database synced & existing tables cleared.');

    // 1. Create Users
    console.log('Creating users...');
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@timetablex.com',
      password: 'admin123',
      role: 'admin'
    });

    const schedulerUser = await User.create({
      username: 'scheduler',
      email: 'scheduler@timetablex.com',
      password: 'scheduler123',
      role: 'admin' // Both users are admins
    });

    console.log(`Users created: admin (${adminUser.email}), scheduler (${schedulerUser.email})`);

    // 2. Create Departments
    console.log('Creating departments...');
    const csDept = await Department.create({
      name: 'Computer Science & Engineering',
      code: 'CSE'
    });

    const eeDept = await Department.create({
      name: 'Electrical Engineering',
      code: 'EE'
    });

    console.log('Departments created.');

    // 3. Create Classrooms
    console.log('Creating classrooms...');
    const room101 = await Classroom.create({
      name: 'Room 101',
      capacity: 60,
      type: 'classroom'
    });

    const room102 = await Classroom.create({
      name: 'Room 102',
      capacity: 50,
      type: 'classroom'
    });

    const lab301 = await Classroom.create({
      name: 'Advanced Lab 301',
      capacity: 35,
      type: 'lab'
    });

    console.log('Classrooms created.');

    // 4. Create Faculty
    console.log('Creating faculty...');
    const turing = await Faculty.create({
      name: 'Dr. Alan Turing',
      email: 'turing@cse.edu',
      maxClassesPerDay: 3,
      departmentId: csDept.id
    });

    const hopper = await Faculty.create({
      name: 'Dr. Grace Hopper',
      email: 'hopper@cse.edu',
      maxClassesPerDay: 3,
      departmentId: csDept.id
    });

    const shannon = await Faculty.create({
      name: 'Dr. Claude Shannon',
      email: 'shannon@ee.edu',
      maxClassesPerDay: 4,
      departmentId: eeDept.id
    });

    console.log('Faculty members created.');

    // 5. Create Subjects
    console.log('Creating subjects...');
    
    // CSE Semester 3 Subjects
    // CS301 is co-taught by Turing and Hopper
    const cs301 = await Subject.create({
      name: 'Data Structures & Algorithms',
      code: 'CS301',
      classesPerWeek: 4,
      semester: 3,
      departmentId: csDept.id
    });
    await cs301.setFaculties([turing.id, hopper.id]);

    const cs302 = await Subject.create({
      name: 'Object Oriented Programming',
      code: 'CS302',
      classesPerWeek: 4,
      semester: 3,
      departmentId: csDept.id
    });
    await cs302.setFaculties([turing.id]);

    const cs303 = await Subject.create({
      name: 'Operating Systems',
      code: 'CS303',
      classesPerWeek: 3,
      semester: 3,
      departmentId: csDept.id
    });
    await cs303.setFaculties([hopper.id]);

    const cs304 = await Subject.create({
      name: 'Database Management Systems',
      code: 'CS304',
      classesPerWeek: 3,
      semester: 3,
      departmentId: csDept.id
    });
    await cs304.setFaculties([hopper.id]);

    // EE Semester 3 Subjects
    const ee301 = await Subject.create({
      name: 'Signals & Systems',
      code: 'EE301',
      classesPerWeek: 4,
      semester: 3,
      departmentId: eeDept.id
    });
    await ee301.setFaculties([shannon.id]);

    const ee302 = await Subject.create({
      name: 'Digital Logic Circuits',
      code: 'EE302',
      classesPerWeek: 4,
      semester: 3,
      departmentId: eeDept.id
    });
    await ee302.setFaculties([shannon.id]);

    console.log('Subjects created.');
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run seed script
seedDatabase();
