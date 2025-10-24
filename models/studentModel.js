import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
    number: { type: String, unique: true, required: true },
    name: { type: String, required: true },
});

const Student = mongoose.model('Student', studentSchema);

export default Student;