import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Teacher'
    },
    studentName: {
        type: String,
        required: true
    },
    studentNumber: {
        type: Number,
    },
    studentEmail: {
        type: String,
        required: true
    },
    studentPhone: {
        type: String
    },
    studentMajor: {
        type: String,
    },
    timeSlot: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, "Time Slot Id Is Required"]
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    userType: {
        type: String,
        required: true,
        enum: ["visitor", "student"],
        default: "visitor"
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    notes: {
        type: String
    },
    educationLevel: {
        type: String,
        enum: ['lisans', 'yukseklisans'],
    }
}, {
    timestamps: true
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;