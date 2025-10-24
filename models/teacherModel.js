import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const BookingOptionsSchema = new mongoose.Schema({
    lisans: { type: [String], default: [] },
    yukseklisans: { type: [String], default: [] },
}, { _id: false });

const teacherSchema = new mongoose.Schema(
    {
        displayName: { type: String, required: true },
        scholarUserId: { type: String, index: true, sparse: true },
        scholarProfileUrl: { type: String },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        photoURL: { type: String },

        faculty: { type: String, default: "" },
        department: { type: String },
        office: { type: String },
        phone: { type: String },
        bio: { type: String },
        bookingOptions: { type: BookingOptionsSchema, default: () => ({}) },

        displayName_lc: { type: String, index: true },
        department_lc: { type: String, index: true },
        email_lc: { type: String, index: true },
        faculty_lc: { type: String, index: true },
        role: { type: String, enum: ['teacher', 'admin'], default: 'teacher', required: true }
    },
    { timestamps: true }
);

teacherSchema.index(
    { displayName: 'text', department: 'text', email: 'text', faculty: 'text' },
    { weights: { displayName: 5, department: 3, faculty: 2, email: 1 }, name: 'TeacherTextIndex' }
);

teacherSchema.index({ displayName_lc: 1 });
teacherSchema.index({ department_lc: 1 });
teacherSchema.index({ email_lc: 1 });
teacherSchema.index({ faculty_lc: 1 });

teacherSchema.methods.matchPassword = async function (enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

teacherSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    // keep searchable copies in sync
    if (this.isModified('displayName')) this.displayName_lc = (this.displayName || '').toLowerCase();
    if (this.isModified('department')) this.department_lc = (this.department || '').toLowerCase();
    if (this.isModified('email')) this.email_lc = (this.email || '').toLowerCase();
    if (this.isModified('faculty')) this.faculty_lc = (this.faculty || '').toLowerCase();

    next();
});

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;
